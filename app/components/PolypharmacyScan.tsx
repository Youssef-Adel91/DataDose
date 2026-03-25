"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Plus, X, Loader2, AlertTriangle, Shield, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

type Severity = "fatal" | "severe" | "major" | "safe";

interface Interaction {
  pair: string;
  drug1: string;
  drug2: string;
  severity: Severity;
  mechanism: string;
  recommendation: string;
}

interface ScanResult {
  drugs: string[];
  interactions: Interaction[];
  graph: { nodes: object[]; edges: object[] };
  summary: {
    totalInteractions: number;
    fatalSevere: number;
    major: number;
    safe: number;
    overallRisk: "HIGH" | "MODERATE" | "LOW";
  };
}

const severityConfig = {
  fatal: {
    bg: "bg-zinc-900",
    border: "border-zinc-700",
    text: "text-white",
    badge: "bg-zinc-800 text-white",
    icon: "⬛",
    label: "FATAL",
  },
  severe: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    badge: "bg-red-500 text-white",
    icon: "🔴",
    label: "SEVERE",
  },
  major: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-800",
    badge: "bg-orange-400 text-white",
    icon: "🟠",
    label: "MAJOR",
  },
  safe: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-800",
    badge: "bg-green-500 text-white",
    icon: "🟢",
    label: "SAFE",
  },
};

const popularDrugs = ["Warfarin", "Aspirin", "Lisinopril", "Metformin", "Simvastatin", "Ibuprofen", "Amiodarone", "Metronidazole"];

export interface PolypharmacyScanProps {
  onScanComplete?: (scannedDrugs: string[]) => void;
}

export default function PolypharmacyScan({ onScanComplete }: PolypharmacyScanProps = {}) {
  const [drugs, setDrugs] = useState<string[]>(["Warfarin", "Aspirin"]);
  const [inputValue, setInputValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [expandedInteraction, setExpandedInteraction] = useState<number | null>(null);
  const [showJSON, setShowJSON] = useState(false);

  const addDrug = (drug: string) => {
    const trimmed = drug.trim();
    if (!trimmed || drugs.length >= 10) return;
    if (drugs.some(d => d.toLowerCase() === trimmed.toLowerCase())) return;
    setDrugs([...drugs, trimmed]);
    setInputValue("");
  };

  const removeDrug = (idx: number) => {
    setDrugs(drugs.filter((_, i) => i !== idx));
  };

  const handleScan = async () => {
    if (drugs.length < 2) {
      setError("Please add at least 2 drugs to scan.");
      return;
    }
    setError("");
    setResult(null);
    setIsScanning(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (onScanComplete) {
        onScanComplete(drugs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const riskColors = {
    HIGH: "bg-red-100 text-red-700 border-red-200",
    MODERATE: "bg-orange-100 text-orange-700 border-orange-200",
    LOW: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8"
      id="polypharmacy-scan"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <Network className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">N-Degree Polypharmacy Scanner</h2>
          <p className="text-sm text-slate-500">Deterministic DDI analysis via Neo4j Knowledge Graph · Feature 1</p>
        </div>
      </div>

      <div className="my-6 grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Add Medications <span className="text-slate-400 font-normal">({drugs.length}/10)</span>
          </label>

          {/* Drug Chips */}
          <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-white border border-slate-200 rounded-xl">
            {drugs.map((drug, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-sm font-medium"
              >
                💊 {drug}
                <button onClick={() => removeDrug(i)} className="text-teal-400 hover:text-teal-700 transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {drugs.length === 0 && (
              <span className="text-xs text-slate-400 self-center">Add medications below…</span>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addDrug(inputValue); }}
              placeholder="Type drug name and press Enter…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
            />
            <button
              onClick={() => addDrug(inputValue)}
              className="px-4 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Quick Add Common Drugs</p>
            <div className="flex flex-wrap gap-1.5">
              {popularDrugs.filter(d => !drugs.some(e => e.toLowerCase() === d.toLowerCase())).map(d => (
                <button
                  key={d}
                  onClick={() => addDrug(d)}
                  className="text-xs px-2.5 py-1 border border-slate-200 rounded-full hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={isScanning || drugs.length < 2}
            className="w-full gradient-teal text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Knowledge Graph…</>
            ) : (
              <><Network className="w-5 h-5" /> Run N-Degree Scan</>
            )}
          </motion.button>
        </div>

        {/* Results Panel */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl"
              >
                <Network className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">Add drugs and click <strong>Run N-Degree Scan</strong> to see interactions</p>
                <p className="text-xs text-slate-300 mt-2">Powered by Neo4j Knowledge Graph · 3,656 active ingredients</p>
              </motion.div>
            )}

            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-600 font-semibold">Traversing Knowledge Graph…</p>
                <p className="text-xs text-slate-400 mt-1">Checking {drugs.length * (drugs.length - 1) / 2} drug pairs</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary Bar */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${riskColors[result.summary.overallRisk]}`}>
                  <div>
                    <p className="font-bold text-sm">Overall Risk: {result.summary.overallRisk}</p>
                    <p className="text-xs opacity-80">{result.summary.totalInteractions} interaction(s) found across {result.drugs.length} drugs</p>
                  </div>
                  <Shield className="w-8 h-8 opacity-40" />
                </div>

                {/* Stat Pills */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold">⬛ Fatal/Severe: {result.summary.fatalSevere}</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">🟠 Major: {result.summary.major}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">🟢 Safe pairs: {result.drugs.length * (result.drugs.length - 1) / 2 - result.summary.totalInteractions}</span>
                </div>

                {/* Interaction List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {result.interactions.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-800 font-semibold text-sm">No significant interactions detected. Safe to dispense.</p>
                    </div>
                  ) : (
                    result.interactions.map((interaction, i) => {
                      const cfg = severityConfig[interaction.severity] || severityConfig.major;
                      const isExpanded = expandedInteraction === i;
                      return (
                        <div
                          key={i}
                          className={`border rounded-xl overflow-hidden ${cfg.border}`}
                        >
                          <button
                            className={`w-full flex items-center justify-between p-3 ${interaction.severity === 'fatal' ? 'bg-zinc-900 text-white' : cfg.bg} text-left`}
                            onClick={() => setExpandedInteraction(isExpanded ? null : i)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{cfg.icon}</span>
                              <span className={`text-sm font-bold ${interaction.severity === 'fatal' ? 'text-white' : cfg.text}`}>
                                {interaction.drug1} + {interaction.drug2}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                          </button>
                          {isExpanded && (
                            <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                              <p className="text-xs text-slate-600"><strong>Mechanism:</strong> {interaction.mechanism}</p>
                              <p className="text-xs text-slate-600"><strong>Recommendation:</strong> {interaction.recommendation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* JSON Payload Viewer */}
                <div>
                  <button
                    onClick={() => setShowJSON(!showJSON)}
                    className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                  >
                    {showJSON ? "▾" : "▸"} View API JSON Payload (Graph Data)
                  </button>
                  {showJSON && (
                    <pre className="mt-2 p-3 bg-slate-900 text-green-400 rounded-lg text-[10px] overflow-x-auto max-h-40">
                      {JSON.stringify(result.graph, null, 2)}
                    </pre>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
