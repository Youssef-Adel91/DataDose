"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface Alternative {
  name: string;
  mechanism: string;
  safeFor: string[];
  avoids: string[];
  ddiRisk: "low" | "none";
  note: string;
}

interface AlternativesResult {
  query: { drug: string; disease: string; symptomToAvoid: string };
  alternativeClass: string;
  alternatives: Alternative[];
  message: string;
}

const popularDrugs = ["Warfarin", "Aspirin", "Simvastatin", "Ibuprofen", "Metformin"];
const popularDiseases = ["Atrial Fibrillation", "Hypertension", "Diabetes", "Osteoarthritis", "Hypercholesterolemia"];
const popularSymptoms = ["Bleeding", "GI upset", "Myopathy", "Hyperkalemia", "Hypoglycemia"];

export default function SmartAlternatives() {
  const [drug, setDrug] = useState("");
  const [disease, setDisease] = useState("");
  const [symptomToAvoid, setSymptomToAvoid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AlternativesResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!drug.trim()) {
      setError("Please enter a drug to replace.");
      return;
    }
    setError("");
    setResult(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drug, disease, symptomToAvoid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Please try again.");
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
      id="smart-alternatives"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Smart Safe Alternatives</h2>
          <p className="text-sm text-slate-500">3-input deterministic engine · Cross-checks DDI with current medications · Feature 2</p>
        </div>
      </div>

      {/* 3-Input Form */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {/* Input 1: Drug to Replace */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            💊 Drug to Replace <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={drug}
            onChange={e => setDrug(e.target.value)}
            placeholder="e.g. Warfarin, Aspirin"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition"
          />
          <div className="flex flex-wrap gap-1">
            {popularDrugs.map(d => (
              <button key={d} onClick={() => setDrug(d)}
                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition">
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Input 2: Disease to Treat */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            🏥 Disease to Treat
          </label>
          <input
            type="text"
            value={disease}
            onChange={e => setDisease(e.target.value)}
            placeholder="e.g. Atrial Fibrillation"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition"
          />
          <div className="flex flex-wrap gap-1">
            {popularDiseases.map(d => (
              <button key={d} onClick={() => setDisease(d)}
                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition">
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Input 3: Symptom to Avoid */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            🚫 Symptom to Avoid
          </label>
          <input
            type="text"
            value={symptomToAvoid}
            onChange={e => setSymptomToAvoid(e.target.value)}
            placeholder="e.g. Bleeding, Myopathy"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition"
          />
          <div className="flex flex-wrap gap-1">
            {popularSymptoms.map(s => (
              <button key={s} onClick={() => setSymptomToAvoid(s)}
                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Finding Safer Alternatives…</>
        ) : (
          <><RefreshCw className="w-5 h-5" /> Find Safe Alternative</>
        )}
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Query Summary */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-800">
                <strong>Query:</strong> Replace <span className="font-bold">{result.query.drug}</span>
                {result.query.disease && <> for <span className="font-bold">{result.query.disease}</span></>}
                {result.query.symptomToAvoid && <> · Avoiding <span className="font-bold">{result.query.symptomToAvoid}</span></>}
              </p>
              <p className="text-xs text-emerald-600 mt-1">{result.message}</p>
            </div>

            {/* Alternative Class Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drug Class:</span>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">{result.alternativeClass}</span>
            </div>

            {/* Alternative Cards */}
            {result.alternatives.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-800">No alternatives found matching all criteria. Please consult a clinical pharmacist.</p>
              </div>
            ) : (
              result.alternatives.map((alt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white border border-green-100 rounded-xl shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <h4 className="font-bold text-slate-800">{alt.name}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alt.ddiRisk === "none" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      DDI Risk: {alt.ddiRisk.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2"><strong>Mechanism:</strong> {alt.mechanism}</p>
                  <p className="text-xs text-slate-600 mb-2"><strong>Avoids:</strong> {alt.avoids.join(", ")}</p>
                  <p className="text-xs text-teal-700 bg-teal-50 rounded-lg p-2 border border-teal-100">
                    💡 {alt.note}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
