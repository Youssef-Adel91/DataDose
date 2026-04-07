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
        print("✅ Successfully connected to Neo4j Knowledge Graph")
    except Exception as e:
        print(f"❌ Failed to connect to Neo4j: {e}")
    yield
    if driver:
        await driver.close()
        print("Cosed Neo4j connection")

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

class GraphRequest(BaseModel):
    drugs: List[str]

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
    WHERE toLower(d1.name) IN lower_drugs AND toLower(d2.name) IN lower_drugs
      AND elementId(d1) < elementId(d2)
    RETURN d1.name AS drug1, d2.name AS drug2, r.severity AS severity, 
           r.effect AS effect, r.mechanism AS mechanism
    """
    
    severity_rank = {"Fatal": 1, "Severe": 2, "Major": 3, "Minor": 4}

    try:
        result = await session.run(query, drugs=req.drugs)
        records = await result.data()
        
        interactions = []
        for rec in records:
            interactions.append(InteractionResponse(
                drug1=rec["drug1"],
                drug2=rec["drug2"],
                severity=rec.get("severity", "Unknown"),
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
    """
    query = """
    WITH [x IN $current_meds | toLower(x)] AS lower_meds
    MATCH (d:Drug)-[:TREATS]->(c:Condition)
    WHERE toLower(c.name) = toLower($disease_to_treat)
    AND toLower(d.name) <> toLower($drug_to_replace)
    AND NOT (d)-[:CAUSES_REACTION]->(:Symptom {name: $symptom_to_avoid}) // Can add tolower if symptom names mismatch
    AND NOT EXISTS {
        MATCH (d)-[:INTERACTS_WITH]-(other:Drug)
        WHERE toLower(other.name) IN lower_meds
    }
    RETURN d.name AS safe_drug
    """
    try:
        result = await session.run(query, 
                                   disease_to_treat=req.disease_to_treat,
                                   drug_to_replace=req.drug_to_replace,
                                   symptom_to_avoid=req.symptom_to_avoid,
                                   current_meds=req.current_meds)
        records = await result.data()
        return [rec["safe_drug"] for rec in records]
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
        return ChatResponse(
            response=final_answer,
            is_deterministic=True,
            raw_data=neo4j_data
        )
    except Exception as e:
        return ChatResponse(
            response=f"Error generating clinical summary: {e}",
            is_deterministic=False,
            raw_data=neo4j_data
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
