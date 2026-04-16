"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  FlaskConical,
  Pill,
  Info,
  X,
  Plus,
  Stethoscope,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SuspectMedication {
  drug: string;
  symptom: string;
  severity: string | null;
  evidence: string | null;
}

interface TracerResponse {
  success: boolean;
  symptomName: string;
  suspects: SuspectMedication[];
  suspectCount: number;
  backendOnline: boolean;
  disclaimer: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["PHYSICIAN", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

const COMMON_SYMPTOMS = [
  "Bleeding",
  "Nausea",
  "Myopathy",
  "Hyperkalemia",
  "Hypoglycemia",
  "Dizziness",
  "GI upset",
  "Rash",
  "Bradycardia",
  "Hepatotoxicity",
];

const COMMON_DRUGS = [
  "Warfarin",
  "Aspirin",
  "Lisinopril",
  "Metformin",
  "Atorvastatin",
  "Amiodarone",
  "Metronidazole",
  "Ibuprofen",
  "Simvastatin",
];

// ── Severity styling map ───────────────────────────────────────────────────────

const severityConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; badge: string; icon: string; glow: string }
> = {
  severe: {
    label: "SEVERE",
    bg: "bg-red-950/80",
    border: "border-red-500",
    text: "text-red-100",
    badge: "bg-red-500 text-white",
    icon: "🔴",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  },
  major: {
    label: "MAJOR",
    bg: "bg-orange-950/80",
    border: "border-orange-400",
    text: "text-orange-100",
    badge: "bg-orange-400 text-white",
    icon: "🟠",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.35)]",
  },
  moderate: {
    label: "MODERATE",
    bg: "bg-yellow-900/60",
    border: "border-yellow-400",
    text: "text-yellow-100",
    badge: "bg-yellow-400 text-slate-900",
    icon: "🟡",
    glow: "shadow-[0_0_15px_rgba(234,179,8,0.3)]",
  },
  minor: {
    label: "MINOR",
    bg: "bg-sky-950/70",
    border: "border-sky-400",
    text: "text-sky-100",
    badge: "bg-sky-400 text-white",
    icon: "🔵",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.25)]",
  },
  info: {
    label: "AI INSIGHT",
    bg: "bg-violet-950/70",
    border: "border-violet-400",
    text: "text-violet-100",
    badge: "bg-violet-500 text-white",
    icon: "✨",
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.35)]",
  },
};

function getSeverityConfig(severity: string | null) {
  if (!severity) return severityConfig.minor;
  const key = severity.toLowerCase();
  return severityConfig[key] ?? severityConfig.minor;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ReverseSymptomTracer() {
  const { user } = useAuth();

  // ── RBAC guard ────────────────────────────────────────────────────────────
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]"
        id="symptom-tracer"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Stethoscope className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-700 mb-1">
            Reverse Symptom Tracer
          </h2>
          <p className="text-slate-500 text-sm max-w-sm">
            This feature is restricted to clinical staff.{" "}
            <strong className="text-slate-700">Consult your doctor</strong> if
            you believe a medication may be causing your symptoms.
          </p>
        </div>
      </motion.div>
    );
  }

  return <TracerUI />;
}

// ── Inner UI (only rendered for authorised roles) ───────────────────────────

function TracerUI() {
  const [symptom, setSymptom] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medications, setMedications] = useState<string[]>([
    "Warfarin",
    "Aspirin",
  ]);
  const [medInput, setMedInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TracerResponse | null>(null);
  const [error, setError] = useState("");
  const symptomInputRef = useRef<HTMLInputElement>(null);

  // Filtered autocomplete list
  const filteredSuggestions = COMMON_SYMPTOMS.filter(
    (s) =>
      s.toLowerCase().includes(symptom.toLowerCase()) && s !== symptom
  );

  const addMedication = (med: string) => {
    const trimmed = med.trim();
    if (!trimmed || medications.length >= 10) return;
    if (medications.some((m) => m.toLowerCase() === trimmed.toLowerCase()))
      return;
    setMedications([...medications, trimmed]);
    setMedInput("");
  };

  const removeMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleTrace = async () => {
    if (!symptom.trim()) {
      setError("Please enter a symptom to trace.");
      return;
    }
    if (medications.length === 0) {
      setError("Please add at least one current medication.");
      return;
    }
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/tracer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptomName: symptom.trim(),
          currentMedications: medications,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Trace failed.");
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Request failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8"
      id="symptom-tracer"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Reverse Symptom Tracer
          </h2>
          <p className="text-sm text-slate-500">
            Forensic causal analysis · Neo4j Knowledge Graph · Feature 4
          </p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full uppercase tracking-wider">
          Clinical Only
        </span>
      </div>

      {/* ── Inputs ── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Symptom Search */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            🔍 Symptom to Trace{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              ref={symptomInputRef}
              type="text"
              value={symptom}
              onChange={(e) => {
                setSymptom(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTrace();
              }}
              placeholder="e.g. Bleeding, Nausea…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition pr-10"
              id="tracer-symptom-input"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSuggestions &&
                symptom.length > 0 &&
                filteredSuggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                  >
                    {filteredSuggestions.map((s) => (
                      <li
                        key={s}
                        onMouseDown={() => {
                          setSymptom(s);
                          setShowSuggestions(false);
                        }}
                        className="px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 cursor-pointer transition"
                      >
                        {s}
                      </li>
                    ))}
                  </motion.ul>
                )}
            </AnimatePresence>
          </div>

          {/* Quick-select pills */}
          <div className="flex flex-wrap gap-1">
            {COMMON_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => setSymptom(s)}
                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Current Medications */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            💊 Current Medications{" "}
            <span className="text-slate-400 font-normal">
              ({medications.length}/10)
            </span>
          </label>

          {/* Chip list */}
          <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-white border border-slate-200 rounded-xl">
            {medications.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium"
              >
                <Pill className="w-3 h-3" /> {m}
                <button
                  onClick={() => removeMedication(i)}
                  className="text-indigo-400 hover:text-indigo-700 transition ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {medications.length === 0 && (
              <span className="text-xs text-slate-400 self-center">
                Add medications below…
              </span>
            )}
          </div>

          {/* Add medication row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addMedication(medInput);
              }}
              placeholder="Type drug name…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              id="tracer-med-input"
            />
            <button
              onClick={() => addMedication(medInput)}
              className="px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick-add common drugs */}
          <div className="flex flex-wrap gap-1">
            {COMMON_DRUGS.filter(
              (d) =>
                !medications.some(
                  (m) => m.toLowerCase() === d.toLowerCase()
                )
            ).map((d) => (
              <button
                key={d}
                onClick={() => addMedication(d)}
                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition"
              >
                + {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}

      {/* Trace Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTrace}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        id="tracer-run-btn"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Tracing through Knowledge
            Graph…
          </>
        ) : (
          <>
            <ShieldAlert className="w-5 h-5" /> Run Forensic Trace
          </>
        )}
      </motion.button>

      {/* ── Results ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-4"
          >
            {/* Summary header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Forensic Report
                </h3>
                <p className="text-xs text-slate-500">
                  Symptom:{" "}
                  <strong className="text-slate-700">{result.symptomName}</strong>{" "}
                  · {result.suspectCount} suspect medication
                  {result.suspectCount !== 1 ? "s" : ""} identified
                </p>
              </div>
              {result.backendOnline ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Neo4j Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Backend Offline
                </span>
              )}
            </div>

            {/* Zero-results clean state */}
            {result.suspects.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    No direct causal link found in the knowledge graph.
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    None of the listed medications have a confirmed causal
                    relationship with{" "}
                    <em>{result.symptomName}</em> across the knowledge graph.
                    Consider checking for underlying conditions or expanding
                    the medication list.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Forensic Cards */}
            <div className="space-y-3">
              {result.suspects.map((suspect, i) => {
                const cfg = getSeverityConfig(suspect.severity);
                const isLLM = suspect.drug === "LLM Clinical Insight";

                return (
                  <motion.div
                    key={`${suspect.drug}-${i}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative rounded-2xl border p-5 overflow-hidden ${cfg.bg} ${cfg.border} ${cfg.glow}`}
                  >
                    {/* Background pulse for severe */}
                    {suspect.severity?.toLowerCase() === "severe" && (
                      <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-2xl pointer-events-none" />
                    )}

                    <div className="relative z-10">
                      {/* Card top row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cfg.icon}</span>
                          <div>
                            <p className="font-bold text-white text-base leading-tight">
                              {isLLM ? (
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-violet-300" />
                                  AI Clinical Insight
                                </span>
                              ) : (
                                suspect.drug
                              )}
                            </p>
                            <p className="text-xs opacity-70 mt-0.5">
                              {isLLM
                                ? "Groq LLM fallback — no graph match found"
                                : `Matched symptom: ${suspect.symptom}`}
                            </p>
                          </div>
                        </div>

                        {/* Severity badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      {/* Evidence / description */}
                      {suspect.evidence && (
                        <div className="mt-2 p-3 bg-black/20 rounded-xl">
                          <p className="text-xs font-semibold opacity-60 uppercase tracking-wider mb-1">
                            {isLLM ? "Clinical Insight" : "Evidence / Mechanism"}
                          </p>
                          <p className="text-sm text-white/90 leading-relaxed">
                            {suspect.evidence}
                          </p>
                        </div>
                      )}

                      {/* Action footer (for graph results) */}
                      {!isLLM && (
                        <p className="mt-3 text-xs opacity-60 italic">
                          → Review medication profile and consider safe substitution via SmartAlternatives engine.
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 text-center pt-2">
              {result.disclaimer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
