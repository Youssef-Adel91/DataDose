"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  severity: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  severity: string;
  label: string;
  mechanism: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  legend?: {
    edgeTypes: Array<{ severity: string; color: string; label: string }>;
  };
}

interface VisualMapProps {
  scannedDrugs?: string[];
}

function getNodeColor(severity: string): string {
  switch (severity) {
    case "danger": return "#14b8a6";
    case "warning": return "#f59e0b";
    case "safe": return "#22c55e";
    default: return "#64748b";
  }
}

function getEdgeColor(severity: string): string {
  switch (severity) {
    case "fatal": return "#18181b";
    case "severe": return "#ef4444";
    case "major": return "#f97316";
    case "minor": return "#eab308";
    default: return "#22c55e";
  }
}

const CANVAS_W = 600;
const CANVAS_H = 400;

function layoutNodes(nodes: GraphNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const n = nodes.length;
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const radius = Math.min(CANVAS_W, CANVAS_H) * 0.35;

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions[node.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  return positions;
}

export default function VisualPrescriptionMap({ scannedDrugs = [] }: VisualMapProps) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const loadGraphData = async (drugsToAnalyze: string[]) => {
    setLoading(true);
    try {
      const payload = { drugs: drugsToAnalyze };
      
      const res = await fetch("/api/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      setData({ nodes: json.nodes, edges: json.edges, legend: json.legend });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scannedDrugs.length > 0) {
      loadGraphData(scannedDrugs);
    } else {
      setData(null);
    }
  }, [scannedDrugs]);

  const positions = data ? layoutNodes(data.nodes) : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8"
      id="visual-map"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Prescription Visual Map</h2>
            <p className="text-sm text-slate-500">Interactive clinical graph powered by Neo4j</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.min(s + 0.2, 2))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => { if (scannedDrugs.length > 0) loadGraphData(scannedDrugs); }}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            title="Reload Graph"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden" style={{ height: 420 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-full"
            style={{ transform: `scale(${scale})`, transformOrigin: "center", transition: "transform 0.2s" }}
          >
            <defs>
              {["fatal", "severe", "major", "minor", "safe"].map(sev => (
                <marker
                  key={sev}
                  id={`arrow-${sev}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={getEdgeColor(sev)} />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {data.edges.map(edge => {
              const src = positions[edge.source];
              const tgt = positions[edge.target];
              if (!src || !tgt) return null;
              const color = getEdgeColor((edge.severity || "").toLowerCase());
              const isHovered = hoveredEdge === edge.id;
              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;
              return (
                <g key={edge.id}>
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={color}
                    strokeWidth={isHovered ? 4 : 2.5}
                    strokeDasharray={edge.edgeType === "shared_symptom" ? "6,4" : "none"}
                    markerEnd={`url(#arrow-${edge.severity})`}
                    className="cursor-pointer transition-all"
                    opacity={isHovered ? 1 : 0.75}
                    onMouseEnter={() => {
                      setHoveredEdge(edge.id);
                      setTooltip({ text: `${edge.label}: ${edge.mechanism}`, x: mx, y: my - 10 });
                    }}
                    onMouseLeave={() => { setHoveredEdge(null); setTooltip(null); }}
                  />
                  {/* Edge label */}
                  <text
                    x={mx} y={my - 8}
                    textAnchor="middle"
                    fontSize="8"
                    fill={color}
                    fontWeight="700"
                    className="pointer-events-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {data.nodes.map(node => {
              const pos = positions[node.id];
              if (!pos) return null;
              const color = getNodeColor(node.severity);
              const isHovered = hoveredNode === node.id;
              const lines = node.label.split("\n");
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onMouseEnter={() => { setHoveredNode(node.id); setTooltip({ text: node.label, x: pos.x, y: pos.y - 45 }); }}
                  onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
                >
                  <circle
                    cx={pos.x} cy={pos.y}
                    r={isHovered ? 36 : 32}
                    fill={color}
                    fillOpacity={0.15}
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-200"
                  />
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={pos.x}
                      y={pos.y + (li - (lines.length - 1) / 2) * 13}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={color}
                      className="pointer-events-none select-none"
                    >
                      {line}
                    </text>
                  ))}
                  <text
                    x={pos.x} y={pos.y + 44}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#64748b"
                    className="pointer-events-none"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <g>
                <rect
                  x={tooltip.x - 90} y={tooltip.y - 20}
                  width={180} height={24}
                  rx={5} fill="rgba(0,0,0,0.75)"
                />
                <text
                  x={tooltip.x} y={tooltip.y - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                >
                  {tooltip.text.substring(0, 40)}{tooltip.text.length > 40 ? "…" : ""}
                </text>
              </g>
            )}
          </svg>
        )}

        {!loading && !data && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in duration-500">
            <GitBranch className="w-12 h-12 mb-3 opacity-30 text-teal-600 outline-teal-500" />
            <p className="text-sm font-semibold max-w-sm">Enter a prescription above and run a scan to generate the interactive clinical map.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider self-center">Legend:</span>
        {[
          { color: "#18181b", label: "⬛ Fatal DDI" },
          { color: "#ef4444", label: "🔴 Severe DDI" },
          { color: "#f97316", label: "🟠 Major DDI" },
          { color: "#eab308", label: "🟡 Shared Symptom" },
          { color: "#22c55e", label: "🟢 Safe" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-6 h-0.5 inline-block rounded" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto italic">
          SVG canvas · Hover nodes/edges for details · React Flow ready
        </span>
      </div>
    </motion.div>
  );
}
