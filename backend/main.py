import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv
import groq
import base64

# Load environment variables
load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+ssc://403ff197.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "403ff197")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

driver = None
groq_client = groq.AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI application to handle database connections."""
    global driver
    try:
        driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        await driver.verify_connectivity()
        print("[OK] Successfully connected to Neo4j Knowledge Graph")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Neo4j: {e}")
    yield
    if driver:
        await driver.close()
        print("Closed Neo4j connection")

app = FastAPI(title="DataDose Neo4j API", version="1.0.0", lifespan=lifespan)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency injection
async def get_db():
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    async with driver.session() as session:
        yield session

# ==========================================
# PYDANTIC MODELS
# ==========================================

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    is_deterministic: bool
    raw_data: List[Any]

class ScanRequest(BaseModel):
    drugs: List[str]
    ehr: Optional[Dict[str, Any]] = None
    conditions: Optional[List[str]] = None
    analysisInstruction: Optional[str] = None

class InteractionResponse(BaseModel):
    drug1: str
    drug2: str
    severity: str
    effect: Optional[str] = None
    mechanism: Optional[str] = None

class AlternativesRequest(BaseModel):
    drug_to_replace: str
    disease_to_treat: str
    symptom_to_avoid: str
    current_meds: List[str]

class TracerRequest(BaseModel):
    patient_drugs: List[str]
    target_symptom: str

class TracerResult(BaseModel):
    drug: str
    mechanism: Optional[str] = None

class GraphRAGRequest(BaseModel):
    message: str
    currentMedications: List[str] = []
    history: List[ChatMessage] = []

class GraphRAGResponse(BaseModel):
    response: str
    is_deterministic: bool
    graph_context: List[Dict[str, Any]]
    extracted_entities: List[str]
    source: str  # "graph+llm" | "llm_only"

class GraphRequest(BaseModel):
    drugs: List[str]

class TracerSymptomRequest(BaseModel):
    symptomName: str
    currentMedications: List[str] = []

class SuspectMedication(BaseModel):
    drug: str
    symptom: str
    severity: Optional[str] = None
    evidence: Optional[str] = None
    source: str = "neo4j"

# ==========================================
# SYMPTOM SYNONYM EXPANSION DICTIONARY
# Covers multilingual variants and lexically-distinct clinical synonyms
# so the graph search matches terms like "hemorrhage" / "نزيف" when user types "Bleeding".
# ==========================================

SYMPTOM_SYNONYMS: dict[str, list[str]] = {
    "bleeding":       ["bleed", "hemorrh", "نزيف", "blood"],
    "myopathy":       ["myopathy", "muscle", "rhabdomyolysis", "عضل"],
    "nausea":         ["nausea", "vomit", "emesis", "غثيان", "قيء"],
    "hyperkalemia":   ["hyperkalemia", "potassium", "بوتاسيوم"],
    "hypoglycemia":   ["hypoglycemia", "sugar", "glucose", "سكر", "نقص"],
    "dizziness":      ["dizziness", "vertigo", "lightheaded", "دوار", "دوخة"],
    "gi upset":       ["gi ", "gastro", "stomach", "ulcer", "معدة", "هضم"],
    "rash":           ["rash", "skin", "dermat", "طفح", "جلد"],
    "bradycardia":    ["bradycardia", "heart rate", "نبض", "بطء"],
    "hepatotoxicity": ["hepato", "liver", "كبد"],
}

# ==========================================
# ENDPOINTS
# ==========================================

@app.post("/api/scan", response_model=List[InteractionResponse], summary="Polypharmacy DDI Scanner")
async def scan_drugs(req: ScanRequest, session=Depends(get_db)):
    """
    Match all existing INTERACTS_WITH relationships strictly between the provided list of drugs.
    Returns inter-drug reactions sorted by severity (Fatal first).
    """
    if not req.drugs or len(req.drugs) < 2:
        return []
    
    query = """
    WITH [x IN $drugs | toLower(x)] AS lower_drugs
    MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)
    WHERE toLower(d1.name) IN lower_drugs
      AND toLower(d2.name) IN lower_drugs
      AND elementId(d1) < elementId(d2)
    RETURN d1.name AS drug1, d2.name AS drug2, r.severity AS severity,
           r.effect AS effect, r.mechanism AS mechanism
    """
    
    severity_rank = {"Fatal": 1, "Severe": 2, "Major": 3, "Minor": 4}

    try:
        result = await session.run(query, drugs=req.drugs)
        records = await result.data()
        
        interactions: List[InteractionResponse] = []
        for rec in records:
            severity_raw = str(rec.get("severity", "Unknown")).strip().lower()
            severity = {
                "fatal": "FATAL",
                "severe": "SEVERE",
                "major": "MAJOR",
                "minor": "MINOR"
            }.get(severity_raw, "UNKNOWN")
            interactions.append(InteractionResponse(
                drug1=rec["drug1"],
                drug2=rec["drug2"],
                severity=severity,
                effect=rec.get("effect"),
                mechanism=rec.get("mechanism")
            ))
            
        # Sort by severity (Fatal->Severe->Major->Minor)
        interactions.sort(key=lambda x: severity_rank.get(x.severity, 99))
        return interactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/alternatives", response_model=List[str], summary="Smart Safe Alternatives")
async def find_alternatives(req: AlternativesRequest, session=Depends(get_db)):
    """
    Finds alternative drugs that treat the target disease, do not cause the target symptom,
    and do not interact with the patient's current medications.
    Uses the Founder's exact Cypher query + Groq LLM hybrid fallback on zero results.
    """
    # ── Founder's exact, production-tested Cypher query ───────────────────────
    # Parameters: $disease (CONTAINS match), $symptom (exact), $current_drugs (list)
    query = """
    WITH [drug IN $current_drugs | toLower(trim(drug))] AS active_rx
    MATCH (alt:Drug)-[:TREATS]->(disease:Disease)
    WHERE toLower(disease.name) CONTAINS toLower(trim($disease))
    AND NOT EXISTS {
        MATCH (alt)-[:CAUSES_REACTION]->(s:Symptom)
        WHERE toLower(s.name) = toLower(trim($symptom))
    }
    AND NOT EXISTS {
        MATCH (alt)-[:INTERACTS_WITH]-(current:Drug)
        WHERE toLower(current.name) IN active_rx
    }
    RETURN alt.name AS Safe_Drug
    LIMIT 10
    """
    try:
        result = await session.run(
            query,
            disease=req.disease_to_treat,
            symptom=req.symptom_to_avoid,
            current_drugs=req.current_meds
        )
        records = await result.data()
        alternatives = [rec["Safe_Drug"] for rec in records]
        print(f"[NEO4J] Alternatives query returned {len(alternatives)} result(s): {alternatives}")

        # ── LLM Hybrid Fallback: fires ONLY when Neo4j returns 0 records ──────
        if not alternatives and groq_client:
            print("[LLM FALLBACK] Neo4j returned 0 results. Engaging Groq fallback...")
            fallback_prompt = f"""You are a clinical pharmacology expert.
A patient needs a replacement for "{req.drug_to_replace}" to treat "{req.disease_to_treat}".
The replacement MUST NOT cause the side effect: "{req.symptom_to_avoid}".
Current medications the replacement MUST NOT interact with: {req.current_meds}.

Suggest EXACTLY 2 safe drug alternatives. Return ONLY a raw JSON array of drug name strings.
Example: ["DrugA", "DrugB"]
No markdown, no explanation, no extra text."""
            try:
                llm_completion = await groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": fallback_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.0,
                    max_completion_tokens=100,
                )
                raw = llm_completion.choices[0].message.content.strip()
                # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1].strip()
                    if raw.startswith("json"):
                        raw = raw[4:].strip()
                fallback_drugs = json.loads(raw)
                if isinstance(fallback_drugs, list):
                    alternatives = [str(d) for d in fallback_drugs[:2]]
                    print(f"[LLM FALLBACK] Suggested: {alternatives}")
            except Exception as llm_err:
                print(f"[WARN] LLM fallback failed: {llm_err}")

        return alternatives
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tracer", response_model=List[TracerResult], summary="Reverse Symptom Tracer")
async def reverse_tracer(req: TracerRequest, session=Depends(get_db)):
    """
    Traces back an unexpected symptom to finding the suspect drug among patient's active meds.
    """
    query = """
    WITH [x IN $patient_drugs | toLower(x)] AS lower_drugs
    MATCH (d:Drug)-[r:CAUSES_REACTION]->(s:Symptom)
    WHERE toLower(s.name) = toLower($target_symptom)
    AND toLower(d.name) IN lower_drugs
    RETURN d.name AS drug, r.mechanism AS mechanism
    """
    try:
        result = await session.run(query, target_symptom=req.target_symptom, patient_drugs=req.patient_drugs)
        records = await result.data()
        return [TracerResult(drug=rec["drug"], mechanism=rec.get("mechanism")) for rec in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trace-symptom", summary="Reverse Symptom Tracer (Feature 4)")
async def trace_symptom(req: TracerSymptomRequest, session=Depends(get_db)):
    """
    Feature 4: Reverse Symptom Tracer — Wide-Net Semantic Search with Synonym Expansion.
    Given a symptom and a list of the patient's current medications, return every drug
    from that list that is linked to the target symptom via any CAUSE/ASSOC/SIDE relationship.

    Key improvements:
    - Synonym Expansion: maps UI terms ("Bleeding") to multilingual / clinical variants
      (["bleed", "hemorrh", "نزيف", "blood"]) so the CONTAINS check casts a far wider net.
    - ANY() predicate: a single Cypher clause checks all expanded keywords at once.
    - Widens rel-type filter to include 'SIDE' in addition to 'CAUSE' and 'ASSOC'.
    - Label-agnostic: catches :Symptom, :SideEffect, and any similarly labelled nodes.
    - Description search: scans the node's description property.
    - Null-safe: COALESCE ensures evidence and severity fields are always populated.
    Falls back to Groq LLM clinical insight when Neo4j returns 0 results.
    """
    if not req.symptomName.strip():
        raise HTTPException(status_code=400, detail="symptomName is required.")

    # ── Synonym Expansion ──────────────────────────────────────────────────────
    target_symptom_lower = req.symptomName.lower().strip()
    # Default to the exact term if not in the dictionary
    search_keywords = SYMPTOM_SYNONYMS.get(target_symptom_lower, [target_symptom_lower])
    try:
        safe_keywords = [k.encode('ascii', 'ignore').decode('ascii') for k in search_keywords]
        print(f"[TRACER] Symptom '{req.symptomName}' expanded to keywords: {safe_keywords}")
    except Exception:
        pass  # Never crash the server over a console log

    # ── Bulletproof Undirected Cypher Query (catches ALL relationship types/directions) ──
    query = """
    WITH [drug IN $currentMedications | toLower(trim(drug))] AS clean_rx
    MATCH (d:Drug)-[r]-(s)
    WHERE toLower(d.name) IN clean_rx
    AND s.name IS NOT NULL
    AND ANY(term IN $symptomKeywords WHERE
        toLower(s.name) CONTAINS term
        OR (s.description IS NOT NULL AND toLower(s.description) CONTAINS term)
    )
    RETURN d.name AS drug, s.name AS symptom, type(r) AS rel_type,
           COALESCE(r.description, r.mechanism, "Potential side effect detected in clinical graph") AS evidence,
           COALESCE(r.severity, "MAJOR") AS severity
    LIMIT 10
    """

    try:
        result = await session.run(
            query,
            symptomKeywords=search_keywords,
            currentMedications=req.currentMedications
        )
        records = await result.data()

        suspects = []
        fallback_insight = None
        for record in records:
            suspects.append({
                "drug": record["drug"],
                "symptom": record["symptom"],
                "evidence": record.get("evidence"),
                "severity": record.get("severity"),
            })
        print(f"[TRACER] Wide-Net query found {len(suspects)} suspect(s) for symptom '{req.symptomName}'")

        # ── Groq LLM Fallback: fires ONLY on zero Neo4j results ───────────────
        if not suspects and groq_client:
            print("[LLM FALLBACK] No graph results found; engaging Groq clinical insight...")
            meds_str = ", ".join(req.currentMedications) if req.currentMedications else "the listed medications"
            fallback_prompt = (
                f"You are a senior clinical pharmacologist. A patient is experiencing '{req.symptomName}'. "
                f"Their current medications are: {meds_str}. "
                f"No direct causal link was found in the clinical knowledge graph. "
                f"Provide ONE concise clinical insight sentence (max 40 words) beginning with: "
                f"'While no direct link exists in the graph for these specific drugs, {req.symptomName} can sometimes be...' "
                f"Mention idiosyncratic reactions and advise checking for underlying conditions."
            )
            try:
                llm_completion = await groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": fallback_prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.0,
                    max_completion_tokens=80,
                )
                fallback_insight = llm_completion.choices[0].message.content.strip()
                suspects = [{
                    "drug": "LLM Clinical Insight",
                    "symptom": req.symptomName,
                    "severity": "info",
                    "evidence": fallback_insight,
                }]
                print(f"[LLM FALLBACK] Insight: {fallback_insight}")
            except Exception as llm_err:
                print(f"[WARN] LLM fallback failed: {llm_err}")
                fallback_insight = None

        return {"suspects": suspects, "fallback_insight": fallback_insight}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/graph", summary="Visual Prescription Map")
async def visual_map(req: GraphRequest, session=Depends(get_db)):
    """
    Traverses the graph for provided drugs to find internal DDIs and shared symptoms,
    formatting output appropriately for React Flow visual mapping.
    """
    query = """
    WITH [x IN $drugs | toLower(x)] AS lower_drugs
    // Find matched nodes
    MATCH (d:Drug) WHERE toLower(d.name) IN lower_drugs
    WITH collect(d) AS drugs_nodes, lower_drugs
    
    // Find DDI edges
    OPTIONAL MATCH (d1:Drug)-[r_int:INTERACTS_WITH]-(d2:Drug) 
    WHERE toLower(d1.name) IN lower_drugs AND toLower(d2.name) IN lower_drugs AND elementId(d1) < elementId(d2)
    WITH drugs_nodes, lower_drugs, collect({source: d1.name, target: d2.name, rel: r_int}) AS interactions
    
    // Find Shared Symptoms
    OPTIONAL MATCH (d1:Drug)-[r_sym:CAUSES_REACTION]->(s:Symptom)<-[r_sym2:CAUSES_REACTION]-(d2:Drug)
    WHERE toLower(d1.name) IN lower_drugs AND toLower(d2.name) IN lower_drugs AND elementId(d1) < elementId(d2)
    WITH drugs_nodes, interactions, collect({source: d1.name, target: d2.name, symptom: s.name}) AS shared_symptoms
    
    RETURN drugs_nodes, interactions, shared_symptoms
    """
    
    try:
        result = await session.run(query, drugs=req.drugs)
        record = await result.single()
        
        nodes = []
        edges = []
        
        if record:
            for drug_node in record.get("drugs_nodes", []):
                name = drug_node["name"]
                nodes.append({
                    "id": name,
                    "data": {"label": name},
                    "type": "default"
                })
                
            for inter in record.get("interactions", []):
                if inter.get("source"):
                    src = inter["source"]
                    tgt = inter["target"]
                    severity = inter["rel"]["severity"] if inter.get("rel") else "Unknown"
                    is_animated = severity in ["Fatal", "Severe"]
                    edges.append({
                        "id": f"ddi_{src}_{tgt}",
                        "source": src,
                        "target": tgt,
                        "label": f"{severity} Interaction",
                        "animated": is_animated
                    })
                    
            for ss in record.get("shared_symptoms", []):
                if ss.get("source"):
                    src = ss["source"]
                    tgt = ss["target"]
                    sym = ss["symptom"]
                    edges.append({
                        "id": f"sym_{src}_{tgt}_{sym}",
                        "source": src,
                        "target": tgt,
                        "label": f"Shared Symptom: {sym}",
                        "animated": False
                    })

        # Add nodes initially requested even if they don't exist in Neo4j to avoid UI breaking
        found_names = {n["id"] for n in nodes}
        for d in req.drugs:
            if d not in found_names:
                nodes.append({
                    "id": d,
                    "data": {"label": d},
                    "type": "default"
                })
                
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Feature 6: Visual Prescription Map ───────────────────────────────────────

class VisualizeGraphRequest(BaseModel):
    currentMedications: List[str]

EDGE_STYLES = {
    "INTERACTS_WITH": {"stroke": "#ef4444", "strokeWidth": 3},   # Red — DDI
    "TREATS":         {"stroke": "#22c55e", "strokeWidth": 2},   # Green — treats
    "CAUSES_REACTION":{"stroke": "#f97316", "strokeWidth": 2},   # Orange — side-effect
}

@app.post("/api/visualize-graph", summary="Visual Prescription Map (Feature 6)")
async def visualize_graph(req: VisualizeGraphRequest, session=Depends(get_db)):
    """
    Feature 6: Visual Prescription Map.
    Returns a strict React Flow-compatible {nodes, edges} payload for the given
    medication list.  Three layers are fetched:
      1. INTERACTS_WITH  — Drug ↔ Drug DDI edges (animated for Fatal/Severe)
      2. TREATS          — Drug → Disease nodes (solid green)
      3. CAUSES_REACTION — Drug → Symptom nodes (dashed orange)
    """
    drugs = [d.strip() for d in req.currentMedications if d.strip()]
    if not drugs:
        raise HTTPException(status_code=400, detail="currentMedications must contain at least one drug.")

    query = """
    WITH [x IN $drugs | toLower(x)] AS lower_drugs

    // 1. Match Drug nodes
    MATCH (d:Drug) WHERE toLower(d.name) IN lower_drugs
    WITH collect(d) AS drug_nodes, lower_drugs

    // 2. DDI edges between selected drugs
    OPTIONAL MATCH (d1:Drug)-[r_ddi:INTERACTS_WITH]-(d2:Drug)
    WHERE toLower(d1.name) IN lower_drugs
      AND toLower(d2.name) IN lower_drugs
      AND elementId(d1) < elementId(d2)
    WITH drug_nodes, lower_drugs,
         collect({src: d1.name, tgt: d2.name, sev: r_ddi.severity, eff: r_ddi.effect}) AS ddi_edges

    // 3. TREATS: Drug → Disease  (limit 2 diseases per drug to keep graph readable)
    OPTIONAL MATCH (d3:Drug)-[:TREATS]->(dis:Disease)
    WHERE toLower(d3.name) IN lower_drugs
    WITH drug_nodes, lower_drugs, ddi_edges,
         collect({src: d3.name, dis_name: dis.name}) AS treats_edges

    // 4. CAUSES_REACTION: Drug → Symptom (limit to meaningful side-effects)
    OPTIONAL MATCH (d4:Drug)-[r_sym:CAUSES_REACTION]->(s:Symptom)
    WHERE toLower(d4.name) IN lower_drugs
      AND (toLower(r_sym.severity) IN ['severe', 'major', 'fatal'] OR r_sym.severity IS NULL)
    WITH drug_nodes, ddi_edges, treats_edges,
         collect({src: d4.name, sym_name: s.name, sev: r_sym.severity}) AS reaction_edges

    RETURN drug_nodes, ddi_edges, treats_edges, reaction_edges
    """

    try:
        result = await session.run(query, drugs=drugs)
        record = await result.single()

        rf_nodes: List[Dict[str, Any]] = []
        rf_edges: List[Dict[str, Any]] = []

        found_drug_ids: set = set()
        disease_ids: set = set()
        symptom_ids: set = set()

        if record:
            # ── Drug nodes ────────────────────────────────────────────────────
            for drug_node in (record.get("drug_nodes") or []):
                name = drug_node["name"]
                node_id = f"drug_{name}"
                found_drug_ids.add(name)
                rf_nodes.append({
                    "id": node_id,
                    "type": "pill",
                    "data": {"label": name, "category": "drug"},
                    "position": {"x": 0, "y": 0},  # layout handled client-side
                })

            # ── DDI edges (INTERACTS_WITH) ─────────────────────────────────
            for edge in (record.get("ddi_edges") or []):
                if not edge.get("src") or not edge.get("tgt"):
                    continue
                sev = str(edge.get("sev") or "Unknown")
                animated = sev.lower() in ("fatal", "severe")
                rf_edges.append({
                    "id": f"ddi_{edge['src']}_{edge['tgt']}",
                    "source": f"drug_{edge['src']}",
                    "target": f"drug_{edge['tgt']}",
                    "label": f"{sev} DDI",
                    "animated": animated,
                    "type": "smoothstep",
                    "style": EDGE_STYLES["INTERACTS_WITH"],
                    "markerEnd": {"type": "arrowclosed", "color": "#ef4444"},
                    "data": {"relType": "INTERACTS_WITH", "severity": sev, "effect": edge.get("eff")},
                })

            # ── TREATS edges → Disease nodes ──────────────────────────────
            for edge in (record.get("treats_edges") or []):
                if not edge.get("src") or not edge.get("dis_name"):
                    continue
                dis_name = edge["dis_name"]
                dis_id = f"disease_{dis_name}"
                if dis_id not in disease_ids:
                    disease_ids.add(dis_id)
                    rf_nodes.append({
                        "id": dis_id,
                        "type": "disease",
                        "data": {"label": dis_name, "category": "disease"},
                        "position": {"x": 0, "y": 0},
                    })
                rf_edges.append({
                    "id": f"treats_{edge['src']}_{dis_name}",
                    "source": f"drug_{edge['src']}",
                    "target": dis_id,
                    "label": "Treats",
                    "animated": False,
                    "type": "smoothstep",
                    "style": EDGE_STYLES["TREATS"],
                    "markerEnd": {"type": "arrowclosed", "color": "#22c55e"},
                    "data": {"relType": "TREATS"},
                })

            # ── CAUSES_REACTION edges → Symptom nodes ·────────────────────
            seen_sym_edges: set = set()
            for edge in (record.get("reaction_edges") or []):
                if not edge.get("src") or not edge.get("sym_name"):
                    continue
                sym_name = edge["sym_name"]
                sym_id = f"symptom_{sym_name}"
                edge_key = f"{edge['src']}_{sym_name}"
                if edge_key in seen_sym_edges:
                    continue
                seen_sym_edges.add(edge_key)
                if sym_id not in symptom_ids:
                    symptom_ids.add(sym_id)
                    rf_nodes.append({
                        "id": sym_id,
                        "type": "symptom",
                        "data": {"label": sym_name, "category": "symptom"},
                        "position": {"x": 0, "y": 0},
                    })
                sev = str(edge.get("sev") or "Unknown")
                rf_edges.append({
                    "id": f"reacts_{edge['src']}_{sym_name}",
                    "source": f"drug_{edge['src']}",
                    "target": sym_id,
                    "label": f"Causes ({sev})",
                    "animated": False,
                    "type": "smoothstep",
                    "style": {**EDGE_STYLES["CAUSES_REACTION"], "strokeDasharray": "6 3"},
                    "markerEnd": {"type": "arrowclosed", "color": "#f97316"},
                    "data": {"relType": "CAUSES_REACTION", "severity": sev},
                })

        # Ensure every requested drug has at least a node (even if not in graph)
        for drug_name in drugs:
            if drug_name not in found_drug_ids:
                rf_nodes.append({
                    "id": f"drug_{drug_name}",
                    "type": "pill",
                    "data": {"label": drug_name, "category": "drug"},
                    "position": {"x": 0, "y": 0},
                })

        return {
            "nodes": rf_nodes,
            "edges": rf_edges,
            "meta": {
                "drugCount": len(drugs),
                "diseaseCount": len(disease_ids),
                "symptomCount": len(symptom_ids),
                "edgeCount": len(rf_edges),
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ocr", summary="Vision OCR Scanner")
async def process_prescription_ocr(file: UploadFile = File(...)):
    """
    Accepts a prescription image and extracts drug names using the Groq Vision LLM.
    """
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    try:
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        vision_prompt = "You are a medical OCR assistant. Read this prescription image. Extract ONLY the names of the medications. Ignore dosages, patient names, and doctor notes. Return the result STRICTLY as a JSON array of strings, e.g., [\"Aspirin\", \"Warfarin\"]. Do not include markdown formatting or any other text."
        
        completion = await groq_client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.0
        )
        
        raw_json_str = completion.choices[0].message.content.strip()
        # Clean markdown if present
        if raw_json_str.startswith("```json"):
            raw_json_str = raw_json_str[7:-3].strip()
        elif raw_json_str.startswith("```"):
            raw_json_str = raw_json_str[3:-3].strip()
            
        import json
        extracted = json.loads(raw_json_str)
        # Force capitalization matching or just standard title casing
        if isinstance(extracted, list):
            extracted = [str(d).title() for d in extracted]
        else:
            extracted = []
            
        return {"extracted_drugs": extracted}

    except Exception as e:
        # Fallback error mechanism
        return {"extracted_drugs": [], "error": str(e)}

@app.post("/api/chat", response_model=ChatResponse, summary="Hybrid GraphRAG Chatbot")
async def chat_interaction(req: ChatRequest, session=Depends(get_db)):
    """
    LLM Router -> Neo4j Deterministic Query -> LLM Synthesizer
    """
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
        
    # Phase 1: LLM Routing
    router_prompt = f"""
    Extract clinical intent from the doctor's message.
    Message: {req.message}
    
    Return ONLY a raw JSON strictly following this schema without any markdown formatting or ticks:
    {{
        "action": "check_interaction" | "find_alternative" | "trace_symptom" | "general",
        "drugs": [], 
        "disease": "", 
        "symptom": "" 
    }}
    """
    
    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": router_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_completion_tokens=200,
        )
        
        raw_json_str = chat_completion.choices[0].message.content.strip()
        # Clean markdown if present
        if raw_json_str.startswith("```json"):
            raw_json_str = raw_json_str[7:-3].strip()
        elif raw_json_str.startswith("```"):
            raw_json_str = raw_json_str[3:-3].strip()
            
        intent = json.loads(raw_json_str)
    except Exception as e:
        return ChatResponse(
            response=f"I encountered an error understanding your request: {e}",
            is_deterministic=False,
            raw_data=[]
        )
        
    action = intent.get("action", "general")
    drugs = intent.get("drugs", [])
    disease = intent.get("disease", "")
    symptom = intent.get("symptom", "")
    
    neo4j_data = []
    
    if action == "check_interaction" and len(drugs) >= 2:
        query = """
        WITH [x IN $drugs | toLower(x)] AS lower_drugs
        MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)
        WHERE toLower(d1.name) IN lower_drugs AND toLower(d2.name) IN lower_drugs
          AND elementId(d1) < elementId(d2)
        RETURN d1.name AS drug1, d2.name AS drug2, r.severity AS severity, r.effect AS effect, r.mechanism AS mechanism
        """
        result = await session.run(query, drugs=drugs)
        neo4j_data = await result.data()
        
    elif action == "find_alternative" and disease and drugs:
        drug_to_replace = drugs[0]
        query = """
        WITH [x IN $current_meds | toLower(x)] AS lower_meds
        MATCH (d:Drug)-[:TREATS]->(c:Condition)
        WHERE toLower(c.name) = toLower($disease_to_treat)
        AND toLower(d.name) <> toLower($drug_to_replace)
        AND NOT EXISTS { MATCH (d)-[:INTERACTS_WITH]-(other:Drug) WHERE toLower(other.name) IN lower_meds }
        RETURN d.name AS safe_drug
        """
        result = await session.run(query, disease_to_treat=disease, drug_to_replace=drug_to_replace, current_meds=drugs)
        neo4j_data = await result.data()
        
    elif action == "trace_symptom" and symptom and drugs:
        query = """
        WITH [x IN $patient_drugs | toLower(x)] AS lower_drugs
        MATCH (d:Drug)-[r:CAUSES_REACTION]->(s:Symptom)
        WHERE toLower(s.name) = toLower($target_symptom)
        AND toLower(d.name) IN lower_drugs
        RETURN d.name AS drug, r.mechanism AS mechanism
        """
        result = await session.run(query, target_symptom=symptom, patient_drugs=drugs)
        neo4j_data = await result.data()
        
    # Phase 2: LLM Synthesis
    synth_prompt = f"""
    You are DataDose AI, a strict Clinical Decision Support System.
    Original user question: {req.message}
    Database findings: {json.dumps(neo4j_data)}
    
    Summarize this exact medical data professionally for a doctor. Base your response ONLY on this JSON. 
    If the JSON is empty, state that no structural associations were found in the clinical database for your request.
    Do NOT invent, infer, hallucinate, or add external medical knowledge.
    """
    
    try:
        synth_completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": synth_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_completion_tokens=400,
        )
        final_answer = synth_completion.choices[0].message.content
        # is_deterministic is True ONLY when the answer is grounded in actual
        # graph data. If neo4j_data is empty (e.g. unknown drug / no path found)
        # the LLM is generating a "no data found" statement — not a deterministic
        # graph result — so we flag it False to signal the frontend accordingly.
        return ChatResponse(
            response=final_answer,
            is_deterministic=len(neo4j_data) > 0,
            raw_data=neo4j_data
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error generating clinical summary: {e}",
            is_deterministic=False,
            raw_data=neo4j_data
        )

# ── Feature 5: GraphRAG AI Medical Assistant ──────────────────────────────────

# Curated clinical vocabulary for fast regex entity extraction
_DRUG_VOCAB = [
    "warfarin","aspirin","lisinopril","metformin","atorvastatin","simvastatin",
    "amiodarone","metronidazole","ibuprofen","acetaminophen","paracetamol",
    "clopidogrel","digoxin","phenytoin","rifampin","fluoxetine","sertraline",
    "paroxetine","sildenafil","amlodipine","losartan","omeprazole","ciprofloxacin",
    "clindamycin","vancomycin","heparin","enoxaparin","apixaban","rivaroxaban",
    "dabigatran","allopurinol","colchicine","prednisone","dexamethasone",
    "levothyroxine","furosemide","spironolactone","hydrochlorothiazide",
    "carvedilol","metoprolol","atenolol","propranolol","ramipril","enalapril",
    "verapamil","diltiazem","nifedipine","codeine","tramadol","morphine",
    "oxycodone","gabapentin","pregabalin","insulin","glipizide","glimepiride",
]

_SYMPTOM_VOCAB = [
    "bleeding","hemorrhage","nausea","vomiting","dizziness","headache",
    "myopathy","rhabdomyolysis","hepatotoxicity","nephrotoxicity","rash",
    "bradycardia","tachycardia","hypotension","hypertension","hypoglycemia",
    "hyperkalemia","hyponatremia","qt prolongation","serotonin syndrome",
    "thrombocytopenia","agranulocytosis","anaphylaxis","gi upset","constipation",
]

def _extract_entities(message: str, current_medications: List[str]) -> List[str]:
    """
    Step A — Fast regex entity extraction.
    Scans the lowercased message against the drug/symptom vocabulary,
    then merges any entries from currentMedications.
    Returns a deduplicated lowercase list.
    """
    lower_msg = message.lower()
    found: set = set()

    # Scan drug vocabulary
    for term in _DRUG_VOCAB:
        # Word-boundary aware: match as standalone word
        import re as _re
        if _re.search(rf"\b{_re.escape(term)}\b", lower_msg):
            found.add(term)

    # Scan symptom vocabulary (useful for trace_symptom intent enrichment)
    for term in _SYMPTOM_VOCAB:
        if term in lower_msg:
            found.add(term)

    # Always include currentMedications (already known from patient session)
    for med in current_medications:
        cleaned = med.strip().lower()
        if cleaned:
            found.add(cleaned)

    return sorted(found)


@app.post("/api/graphrag", response_model=GraphRAGResponse, summary="GraphRAG AI Medical Assistant (Feature 5)")
async def graphrag_assistant(req: GraphRAGRequest, session=Depends(get_db)):
    """
    Feature 5: GraphRAG AI Medical Assistant.

    Step A — Entity Extraction: regex + currentMedications merge.
    Step B — Graph Retrieval: open-ended Cypher traversal fetching DDI,
              TREATS, and CAUSES_REACTION relationships for extracted drugs.
    Step C — Augmented Generation: Groq llama3-8b-8192 with graph context
              injected into the system prompt (strict hallucination guard).
    """
    if not groq_client:
        raise HTTPException(status_code=503, detail="Groq API key not configured.")

    # ── Step A: Entity Extraction ─────────────────────────────────────────────
    extracted_entities = _extract_entities(req.message, req.currentMedications)
    drug_entities = [e for e in extracted_entities if e in _DRUG_VOCAB or
                     any(e.lower() == m.lower() for m in req.currentMedications)]

    # ── Step B: Graph Retrieval ───────────────────────────────────────────────
    graph_context: List[Dict[str, Any]] = []

    if drug_entities:
        cypher = """
        MATCH (d:Drug)-[r]-(n)
        WHERE toLower(d.name) IN $extracted_drugs
        RETURN
            d.name          AS entity,
            type(r)         AS relationship,
            n.name          AS related_node,
            labels(n)[0]    AS node_type,
            r.severity      AS severity,
            r.effect        AS effect,
            r.mechanism     AS mechanism
        LIMIT 30
        """
        try:
            result = await session.run(cypher, extracted_drugs=drug_entities)
            graph_context = await result.data()
            print(f"[GRAPHRAG] Graph retrieval: {len(graph_context)} rows for entities {drug_entities}")
        except Exception as neo_err:
            print(f"[GRAPHRAG][WARN] Neo4j query failed: {neo_err}")
            graph_context = []

    # ── Step C: Augmented Generation ─────────────────────────────────────────

    # Format graph rows into a compact, LLM-readable evidence block
    if graph_context:
        evidence_lines = []
        for row in graph_context:
            parts = [
                f"- {row.get('entity')} --[{row.get('relationship')}]--> {row.get('related_node')} ({row.get('node_type')})"
            ]
            if row.get("severity"):
                parts.append(f"  Severity: {row['severity']}")
            if row.get("effect"):
                parts.append(f"  Effect: {row['effect']}")
            if row.get("mechanism"):
                parts.append(f"  Mechanism: {row['mechanism']}")
            evidence_lines.append("\n".join(parts))
        graph_context_str = "\n".join(evidence_lines)
        source = "graph+llm"
    else:
        graph_context_str = "No relevant data found in the Neo4j Knowledge Graph for the entities in this query."
        source = "llm_only"

    # Build conversation history for multi-turn context
    history_msgs = []
    for h in req.history[-6:]:  # Keep last 6 turns to stay within token budget
        history_msgs.append({"role": h.role, "content": h.content})

    system_prompt = f"""You are DataDose Clinical AI — a specialist Clinical Decision Support System powered by a Neo4j pharmacological Knowledge Graph.

GRAPH DATABASE CONTEXT (retrieved for this query):
{graph_context_str}

STRICT RULES:
1. Answer using ONLY the Graph Database Context above.
2. If the context contains relevant data, cite it explicitly (mention drug names, severity, mechanisms).
3. If the context is empty or irrelevant, clearly state: "No direct data was found in the clinical graph for this query." Then provide a brief, conservative general clinical note with a warning to verify with a pharmacist.
4. Do NOT hallucinate drug interactions, dosages, or clinical facts not present in the context.
5. Format your response with markdown: use **bold** for drug names, ## for section headers when needed, and bullet points for lists.
6. End every response with a clinical safety disclaimer in italics."""

    messages_payload = [
        {"role": "system", "content": system_prompt},
        *history_msgs,
        {"role": "user", "content": req.message},
    ]

    try:
        completion = await groq_client.chat.completions.create(
            messages=messages_payload,
            model="llama3-8b-8192",
            temperature=0.1,
            max_completion_tokens=600,
        )
        final_answer = completion.choices[0].message.content.strip()
        is_deterministic = len(graph_context) > 0
    except Exception as llm_err:
        print(f"[GRAPHRAG][ERROR] LLM generation failed: {llm_err}")
        final_answer = "I encountered an error generating the clinical response. Please retry or consult a pharmacist directly."
        is_deterministic = False

    return GraphRAGResponse(
        response=final_answer,
        is_deterministic=is_deterministic,
        graph_context=graph_context,
        extracted_entities=extracted_entities,
        source=source,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
