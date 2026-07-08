"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Plus,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Info,
  Stethoscope,
  Pill,
  ShieldCheck,
  Activity,
  User,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GraphMeta {
  drugCount: number;
  diseaseCount: number;
  symptomCount: number;
  edgeCount: number;
}

interface VisualMapProps {
  scannedDrugs?: string[];
  selectedPatient?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["PHYSICIAN", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────────────────────
// Custom Node Components
// ─────────────────────────────────────────────────────────────────────────────

function PatientNode({ data }: { data: { label: string } }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-indigo-400 bg-indigo-750 text-white shadow-xl shadow-indigo-500/30 text-xs font-black cursor-default select-none whitespace-nowrap">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
      {data.label} (Patient Chart)
    </div>
  );
}

function PillNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-teal-400 bg-teal-600/90 text-white shadow-lg shadow-teal-500/30 text-xs font-bold cursor-default select-none whitespace-nowrap"
      title={`Drug: ${data.label}`}
    >
      <Pill className="w-3.5 h-3.5 flex-shrink-0" />
      {data.label}
    </div>
  );
}

function IngredientNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-purple-400 bg-purple-900/80 text-purple-100 shadow-md text-xs font-semibold cursor-default select-none whitespace-nowrap"
      title={`Active Ingredient: ${data.label}`}
    >
      <FlaskConical className="w-3.5 h-3.5 flex-shrink-0 text-purple-300" />
      {data.label}
    </div>
  );
}

function DiseaseNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-blue-400 bg-blue-600/90 text-white shadow-lg shadow-blue-500/25 text-xs font-semibold cursor-default select-none max-w-[140px] text-center"
      title={`Disease: ${data.label}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="leading-tight">{data.label}</span>
    </div>
  );
}

function SymptomNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md border-2 border-orange-400 bg-orange-500/90 text-white shadow-lg shadow-orange-400/25 text-xs font-semibold cursor-default select-none max-w-[130px] text-center"
      title={`Symptom: ${data.label}`}
    >
      <Activity className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="leading-tight">{data.label}</span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  patient: PatientNode,
  pill: PillNode,
  ingredient: IngredientNode,
  disease: DiseaseNode,
  symptom: SymptomNode,
};

const COMMON_DRUGS = [
  "Warfarin",
  "Aspirin",
  "Lisinopril",
  "Metformin",
  "Atorvastatin",
  "Amiodarone",
  "Ibuprofen",
  "Simvastatin",
  "Amoxicillin",
];

// ─────────────────────────────────────────────────────────────────────────────
// Root export — RBAC gated
// ─────────────────────────────────────────────────────────────────────────────

export default function VisualPrescriptionMap({ scannedDrugs = [], selectedPatient }: VisualMapProps) {
  const { user } = useAuth();

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]"
        id="visual-map"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Stethoscope className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-700 mb-1">Visual Prescription Map</h2>
          <p className="text-slate-500 text-sm max-w-sm">
            This feature is restricted to clinical staff.{" "}
            <strong className="text-slate-700">Consult your doctor</strong> for medication
            information.
          </p>
        </div>
      </motion.div>
    );
  }

  return <VisualMapCanvas scannedDrugs={scannedDrugs} selectedPatient={selectedPatient} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner canvas
// ─────────────────────────────────────────────────────────────────────────────

function VisualMapCanvas({ scannedDrugs, selectedPatient }: { scannedDrugs: string[]; selectedPatient?: any }) {
  const [drugs, setDrugs] = useState<string[]>(() =>
    scannedDrugs.length > 0 ? scannedDrugs : ["Metformin", "Atorvastatin"]
  );
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<GraphMeta | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Sync state if selectedPatient has current medications
  useEffect(() => {
    if (selectedPatient && Array.isArray(selectedPatient.currentMeds)) {
      setDrugs(selectedPatient.currentMeds.map((m: any) => m.name));
    }
  }, [selectedPatient]);

  // Sync state if scannedDrugs changes
  useEffect(() => {
    if (scannedDrugs && scannedDrugs.length > 0) {
      // normalize names by stripping doses if they are space-separated
      const normalized = scannedDrugs.map((d) => d.split(" ")[0]);
      setDrugs(normalized);
    }
  }, [scannedDrugs]);

  // Load Graph on drugs update
  useEffect(() => {
    if (drugs.length === 0 && !selectedPatient) {
      setNodes([]);
      setEdges([]);
      setMeta(null);
      return;
    }

    const timer = setTimeout(() => loadGraph(drugs), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugs, selectedPatient]);

  const loadGraph = async (medicationList: string[]) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/visualize-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentMedications: medicationList }),
      });
      const data = await res.json();
      setBackendOnline(data.backendOnline ?? true);

      // Determine if we need to build local clinical relationship model (demo mode or offline)
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !data.backendOnline;

      if (isDemoMode) {
        // Construct high-fidelity clinical layout centered around the Patient node
        const activePatientName = selectedPatient?.name || "Active Patient";
        const patientAllergies = selectedPatient?.allergies || "None documented";

        const localNodes: Node[] = [];
        const localEdges: Edge[] = [];

        // 1. Center Patient Node
        localNodes.push({
          id: "patient_root",
          type: "patient",
          data: { label: activePatientName },
          position: { x: 0, y: 0 },
        });

        // 2. Parse patient conditions
        const conditions = selectedPatient?.condition
          ? String(selectedPatient.condition).split(",").map((c: string) => c.trim())
          : ["General Health"];

        conditions.forEach((cond, idx) => {
          const diseaseId = `disease_${cond.replace(/\s+/g, "_")}`;
          localNodes.push({
            id: diseaseId,
            type: "disease",
            data: { label: cond },
            position: { x: -220, y: idx * 100 - (conditions.length - 1) * 50 },
          });

          // Connect Patient to Disease
          localEdges.push({
            id: `patient-to-${diseaseId}`,
            source: "patient_root",
            target: diseaseId,
            label: "Diagnosed",
            animated: true,
            style: { stroke: "#60a5fa", strokeWidth: 2 },
            data: { relType: "DIAGNOSED_WITH" },
          });
        });

        // 3. Parse medications and active ingredients
        medicationList.forEach((drugName, idx) => {
          const drugId = `drug_${drugName.replace(/\s+/g, "_")}`;
          localNodes.push({
            id: drugId,
            type: "pill",
            data: { label: drugName },
            position: { x: 220, y: idx * 120 - (medicationList.length - 1) * 60 },
          });

          // Determine Active Ingredient
          let activeIng = drugName;
          if (drugName.toLowerCase().includes("amoxicillin")) activeIng = "Beta-lactam Antibiotic";
          else if (drugName.toLowerCase().includes("metformin")) activeIng = "Biguanide";
          else if (drugName.toLowerCase().includes("lisinopril")) activeIng = "ACE Inhibitor";
          else if (drugName.toLowerCase().includes("warfarin")) activeIng = "Vitamin K Antagonist";
          else if (drugName.toLowerCase().includes("aspirin")) activeIng = "Salicylate Antiplatelet";
          else if (drugName.toLowerCase().includes("simvastatin")) activeIng = "HMG-CoA Reductase Inhibitor";

          const ingId = `ing_${activeIng.replace(/\s+/g, "_")}`;

          // Add ingredient node if not already present
          if (!localNodes.some((n) => n.id === ingId)) {
            localNodes.push({
              id: ingId,
              type: "ingredient",
              data: { label: activeIng },
              position: { x: 440, y: idx * 120 - (medicationList.length - 1) * 60 },
            });
          }

          // Connect drug to active ingredient
          localEdges.push({
            id: `${drugId}-to-${ingId}`,
            source: drugId,
            target: ingId,
            label: "Contains",
            style: { stroke: "#c084fc", strokeWidth: 1.5 },
            data: { relType: "ACTIVE_INGREDIENT" },
          });

          // 4. Clinical safety link styling
          let strokeColor = "#10b981"; // Safe Green by default
          let strokeWidth = 2;
          let label = "Prescribed";
          let animated = false;
          let severity = "safe";

          // Allergy Contraindication (Amoxicillin/Penicillin allergy)
          const isAllergyConflict =
            patientAllergies.toLowerCase().includes("penicillin") &&
            (drugName.toLowerCase().includes("amoxicillin") || drugName.toLowerCase().includes("penic"));

          // Metformin CKD check
          const isCKDMetforminConflict =
            drugName.toLowerCase().includes("metformin") &&
            conditions.some((c) => c.toLowerCase().includes("ckd") || c.toLowerCase().includes("kidney"));

          if (isAllergyConflict) {
            strokeColor = "#ef4444"; // Severe Red
            strokeWidth = 3.5;
            label = "ALLERGY CONTRAINDICATION!";
            animated = true;
            severity = "critical";
          } else if (isCKDMetforminConflict) {
            strokeColor = "#f59e0b"; // Monitor Yellow
            strokeWidth = 2.5;
            label = "eGFR renal warning";
            animated = true;
            severity = "warning";
          }

          localEdges.push({
            id: `patient-to-${drugId}`,
            source: "patient_root",
            target: drugId,
            label,
            animated,
            style: { stroke: strokeColor, strokeWidth },
            data: { relType: "PRESCRIBED_THERAPY", severity, effect: label },
          });

          // 5. Connect Drugs to Diseases if they treat them
          conditions.forEach((cond) => {
            const diseaseId = `disease_${cond.replace(/\s+/g, "_")}`;
            let treats = false;
            if (drugName.toLowerCase().includes("metformin") && cond.toLowerCase().includes("diabet")) treats = true;
            if (drugName.toLowerCase().includes("lisinopril") && cond.toLowerCase().includes("hyperten")) treats = true;

            if (treats) {
              localEdges.push({
                id: `${drugId}-treats-${diseaseId}`,
                source: drugId,
                target: diseaseId,
                label: "Treats",
                style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" },
                data: { relType: "INDICATED_FOR" },
              });
            }
          });
        });

        // 6. Connect severe Drug-Drug Interactions (Lisinopril + Aspirin)
        const drugNames = medicationList.map((d) => d.toLowerCase());
        if (drugNames.includes("lisinopril") && drugNames.includes("aspirin")) {
          localEdges.push({
            id: "lisinopril-aspirin-ddi",
            source: "drug_Lisinopril",
            target: "drug_Aspirin",
            label: "DDI: Decreases BP efficacy",
            style: { stroke: "#f59e0b", strokeWidth: 2.5, strokeDasharray: "2 2" },
            data: { relType: "DRUG_INTERACTION", severity: "warning", effect: "Decreases BP vasodilatory mechanism" },
          });
        }

        setNodes(localNodes);
        setEdges(localEdges);
        setMeta({
          drugCount: medicationList.length,
          diseaseCount: conditions.length,
          symptomCount: 0,
          edgeCount: localEdges.length,
        });
      } else {
        setMeta(data.meta ?? null);
        setNodes(data.nodes ?? []);
        setEdges(data.edges ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph.");
    } finally {
      setLoading(false);
    }
  };

  const addDrug = (drugName: string) => {
    const trimmed = drugName.trim();
    if (!trimmed || drugs.length >= 10) return;
    if (drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return;
    setDrugs((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeDrug = (idx: number) => setDrugs((prev) => prev.filter((_, i) => i !== idx));

  const nodeColor = (n: Node) => {
    if (n.type === "patient") return "#4338ca";
    if (n.type === "pill") return "#0d9488";
    if (n.type === "ingredient") return "#7e22ce";
    if (n.type === "disease") return "#1d4ed8";
    if (n.type === "symptom") return "#ea580c";
    return "#64748b";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8"
      id="visual-map"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-cyan-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Visual Prescription Map</h2>
            <p className="text-xs text-slate-500">Interactive Clinical Knowledge Map with Safety Color Codes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedPatient && (
            <div className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs text-slate-700">
              <User className="w-4 h-4 text-teal-700" />
              <span>Active Chart: <strong>{selectedPatient.name}</strong></span>
            </div>
          )}
          <button
            onClick={() => loadGraph(drugs)}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
            title="Reload graph"
            id="visual-map-reload-btn"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Medication Input Strip ── */}
      <div className="mb-5 space-y-3 text-left">
        {/* Chip list */}
        <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          {drugs.map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-bold uppercase tracking-wide"
            >
              <Pill className="w-3 h-3 text-teal-600" /> {d}
              <button onClick={() => removeDrug(i)} className="text-teal-400 hover:text-teal-700 transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {drugs.length === 0 && (
            <span className="text-xs text-slate-400 self-center">Add medications to map…</span>
          )}
        </div>

        {/* Add row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addDrug(inputValue);
            }}
            placeholder="Type drug name and press Enter…"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 transition text-slate-850"
            id="visual-map-drug-input"
          />
          <button
            onClick={() => addDrug(inputValue)}
            className="px-4 py-2.5 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 transition font-semibold text-xs cursor-pointer flex items-center"
            id="visual-map-add-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick add */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_DRUGS.filter((d) => !drugs.some((m) => m.toLowerCase() === d.toLowerCase())).map((d) => (
            <button
              key={d}
              onClick={() => addDrug(d)}
              className="text-[10px] px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 transition cursor-pointer"
            >
              + {d}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-655 font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* ── Meta pill bar ── */}
      {meta && !loading && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            👤 Patient: {selectedPatient?.name || "None"}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full">
            💊 {meta.drugCount} Drug{meta.drugCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
            🧪 Active Ingredients
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
            🛡 {meta.diseaseCount} Disease{meta.diseaseCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-650 rounded-full">
            🔗 {meta.edgeCount} Relationship{meta.edgeCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── React Flow Canvas ── */}
      <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-950" style={{ height: 500 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-955/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-300 font-semibold">Traversing clinical nodes...</p>
          </div>
        )}

        {!loading && drugs.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-900">
            <GitBranch className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 font-semibold">
              Add medications or select a patient to view the clinical map
            </p>
          </div>
        )}

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={(_, edge) => setSelectedEdge(edge)}
          onPaneClick={() => setSelectedEdge(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2.5}
          className="bg-slate-950"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
          <Controls className="[&>button]:bg-slate-800 [&>button]:border-slate-700 [&>button]:text-slate-300 [&>button:hover]:bg-slate-700" />
          <MiniMap
            nodeColor={nodeColor}
            maskColor="rgba(15,23,42,0.75)"
            style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          />
        </ReactFlow>
      </div>

      {/* ── Edge detail popover ── */}
      <AnimatePresence>
        {selectedEdge && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 flex items-start gap-3 p-4 bg-slate-900 border border-slate-700 rounded-xl text-left"
          >
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-white truncate">{String(selectedEdge.label)}</p>
              {selectedEdge.data?.relType && (
                <p className="text-[11px] text-slate-450 mt-1">
                  Relationship: <span className="font-mono text-cyan-400">{String(selectedEdge.data.relType)}</span>
                  {selectedEdge.data?.severity && (
                    <>
                      {" "}
                      · Severity:{" "}
                      <span
                        className={
                          selectedEdge.data.severity === "critical"
                            ? "text-red-500 font-bold"
                            : "text-amber-500 font-bold"
                        }
                      >
                        {String(selectedEdge.data.severity).toUpperCase()}
                      </span>
                    </>
                  )}
                  {selectedEdge.data?.effect && (
                    <>
                      {" "}
                      · Clinical Note: <span className="text-slate-300">{String(selectedEdge.data.effect)}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            <button onClick={() => setSelectedEdge(null)} className="text-slate-500 hover:text-slate-350 transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ── */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-slate-600 border-t pt-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend:</span>

        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Patient Node
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Drug Node
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-lg bg-purple-650 inline-block" /> Active Ingredient
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Disease Node
        </span>

        <span className="w-px h-4 bg-slate-200" />

        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-6 h-0.5 bg-red-500 inline-block" /> Contraindication (Critical Red)
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-6 h-0.5 bg-yellow-500 inline-block" /> Warning Alert (Yellow)
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-6 h-0.5 bg-green-500 inline-block" /> Indication / Safe treats (Green)
        </span>

        <span className="ml-auto text-[10px] text-slate-400 italic">
          Click link path to inspect · Scroll zoom
        </span>
      </div>
    </motion.div>
  );
}
