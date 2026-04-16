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
  /** Pre-loaded drugs (e.g. from a completed polypharmacy scan). */
  scannedDrugs?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RBAC
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["PHYSICIAN", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────────────────────
// Layout helper — radial + layered positioning
// ─────────────────────────────────────────────────────────────────────────────

function applyLayout(rawNodes: Node[]): Node[] {
  const drugs = rawNodes.filter((n) => n.type === "pill");
  const diseases = rawNodes.filter((n) => n.type === "disease");
  const symptoms = rawNodes.filter((n) => n.type === "symptom");

  const DRUG_RADIUS = 200;
  const DISEASE_RADIUS = 400;
  const SYMPTOM_RADIUS = 560;
  const CX = 400;
  const CY = 300;

  const place = (nodes: Node[], radius: number, startAngle = 0): Node[] =>
    nodes.map((n, i) => {
      const angle = startAngle + (2 * Math.PI * i) / nodes.length;
      return {
        ...n,
        position: {
          x: CX + radius * Math.cos(angle) - 60,
          y: CY + radius * Math.sin(angle) - 20,
        },
      };
    });

  return [
    ...place(drugs, DRUG_RADIUS),
    ...place(diseases, DISEASE_RADIUS, Math.PI / 6),
    ...place(symptoms, SYMPTOM_RADIUS, Math.PI / 3),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Node Components
// ─────────────────────────────────────────────────────────────────────────────

// Pill node — teal capsule for Drug
function PillNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-teal-400 bg-teal-600/90 text-white shadow-lg shadow-teal-500/30 text-sm font-bold cursor-default select-none whitespace-nowrap"
      title={`Drug: ${data.label}`}
    >
      <Pill className="w-3.5 h-3.5 flex-shrink-0" />
      {data.label}
    </div>
  );
}

// Disease node — shield shape (blue)
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

// Symptom node — orange triangle/warning shape
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
  pill: PillNode,
  disease: DiseaseNode,
  symptom: SymptomNode,
};

// ─────────────────────────────────────────────────────────────────────────────
// Common quick-add drugs
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_DRUGS = [
  "Warfarin",
  "Aspirin",
  "Lisinopril",
  "Metformin",
  "Atorvastatin",
  "Amiodarone",
  "Ibuprofen",
  "Simvastatin",
];

// ─────────────────────────────────────────────────────────────────────────────
// Root export — RBAC gated
// ─────────────────────────────────────────────────────────────────────────────

export default function VisualPrescriptionMap({ scannedDrugs = [] }: VisualMapProps) {
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

  return <VisualMapCanvas scannedDrugs={scannedDrugs} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner canvas — only rendered for authorised roles
// ─────────────────────────────────────────────────────────────────────────────

function VisualMapCanvas({ scannedDrugs }: { scannedDrugs: string[] }) {
  const [drugs, setDrugs] = useState<string[]>(() =>
    scannedDrugs.length > 0 ? scannedDrugs : ["Warfarin", "Aspirin"]
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

  // ── Sync scannedDrugs prop → internal drug list ──
  useEffect(() => {
    if (scannedDrugs.length > 0) {
      setDrugs(scannedDrugs);
    }
  }, [scannedDrugs]);

  // Fetch graph whenever drug list changes (debounced)
  useEffect(() => {
    if (drugs.length === 0) {
      setNodes([]);
      setEdges([]);
      setMeta(null);
      return;
    }

    const timer = setTimeout(() => loadGraph(drugs), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugs]);

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
      if (!res.ok) throw new Error(data.error || "Graph fetch failed.");

      setBackendOnline(data.backendOnline ?? true);
      setMeta(data.meta ?? null);

      const positioned = applyLayout(data.nodes ?? []);
      setNodes(positioned);
      setEdges(data.edges ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph.");
    } finally {
      setLoading(false);
    }
  };

  // ── Medication management ──
  const addDrug = (drug: string) => {
    const trimmed = drug.trim();
    if (!trimmed || drugs.length >= 10) return;
    if (drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return;
    setDrugs((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeDrug = (idx: number) =>
    setDrugs((prev) => prev.filter((_, i) => i !== idx));

  // ── MiniMap node color ──
  const nodeColor = (n: Node) => {
    if (n.type === "pill") return "#0d9488";
    if (n.type === "disease") return "#2563eb";
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Visual Prescription Map
            </h2>
            <p className="text-sm text-slate-500">
              Interactive React Flow canvas · Neo4j Knowledge Graph · Feature 6
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!backendOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Backend Offline
            </span>
          )}
          <button
            onClick={() => loadGraph(drugs)}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
            title="Reload graph"
            id="visual-map-reload-btn"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Medication input strip ── */}
      <div className="mb-5 space-y-3">
        {/* Chip list */}
        <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 bg-white border border-slate-200 rounded-xl">
          {drugs.map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium"
            >
              <Pill className="w-3 h-3" /> {d}
              <button
                onClick={() => removeDrug(i)}
                className="text-teal-400 hover:text-teal-700 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {drugs.length === 0 && (
            <span className="text-xs text-slate-400 self-center">
              Add medications to visualize…
            </span>
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
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition"
            id="visual-map-drug-input"
          />
          <button
            onClick={() => addDrug(inputValue)}
            className="px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-semibold text-sm"
            id="visual-map-add-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick add */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_DRUGS.filter(
            (d) => !drugs.some((m) => m.toLowerCase() === d.toLowerCase())
          ).map((d) => (
            <button
              key={d}
              onClick={() => addDrug(d)}
              className="text-xs px-2.5 py-1 border border-slate-200 rounded-full hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 transition"
            >
              + {d}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* ── Meta pill bar ── */}
      {meta && !loading && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-bold px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full">
            💊 {meta.drugCount} Drug{meta.drugCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
            🛡 {meta.diseaseCount} Disease{meta.diseaseCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full">
            ⚠ {meta.symptomCount} Symptom{meta.symptomCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            🔗 {meta.edgeCount} Relationship{meta.edgeCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── React Flow Canvas ── */}
      <div
        className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-950"
        style={{ height: 500 }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-300 font-semibold">
              Traversing Knowledge Graph…
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fetching {drugs.length} drug{drugs.length !== 1 ? "s" : ""} + relationships
            </p>
          </div>
        )}

        {!loading && drugs.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <GitBranch className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 font-semibold">
              Add medications above to generate the interactive clinical map
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Powered by Neo4j · Visualizes Drug → Disease → Symptom relationships
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
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#334155"
          />
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
            className="mt-4 flex items-start gap-3 p-4 bg-slate-900 border border-slate-700 rounded-xl"
          >
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {String(selectedEdge.label)}
              </p>
              {selectedEdge.data?.relType && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Relationship: <span className="font-mono text-cyan-400">{String(selectedEdge.data.relType)}</span>
                  {selectedEdge.data?.severity && (
                    <> · Severity: <span className="text-orange-400">{String(selectedEdge.data.severity)}</span></>
                  )}
                  {selectedEdge.data?.effect && (
                    <> · Effect: <span className="text-slate-300">{String(selectedEdge.data.effect)}</span></>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedEdge(null)}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ── */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legend:</span>

        {/* Node types */}
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Drug
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Disease
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> Symptom
        </span>

        <span className="w-px h-4 bg-slate-200" />

        {/* Edge types */}
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-6 h-0.5 bg-red-500 inline-block" /> DDI (Interaction)
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-6 h-0.5 bg-green-500 inline-block" /> Treats
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className="w-6 h-0.5 inline-block"
            style={{
              background:
                "repeating-linear-gradient(90deg,#f97316 0,#f97316 4px,transparent 4px,transparent 8px)",
            }}
          />
          Causes Reaction
        </span>

        <span className="ml-auto text-[10px] text-slate-400 italic">
          Click an edge to inspect · Drag to pan · Scroll to zoom
        </span>
      </div>
    </motion.div>
  );
}
