"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Activity, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";

export default function SymptomDetector() {
  const [symptom, setSymptom] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleDetect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptom.trim()) return;
    
    setIsAnalyzing(true);
    setHasResult(false);
    
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasResult(true);
    }, 1500);
  };

  const sampleSymptoms = ["Severe Headache", "Unexplained Bruising", "Muscle Weakness", "Dry Cough"];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-6">
              <Activity className="w-3.5 h-3.5" />
              KILLER FEATURE
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
              Reverse Symptom Detector
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Patient presenting with a strange new symptom? Enter it into our AI engine. DataDose instantly scans their current medication list to identify the likely drug culprit.
            </p>
            
            <ul className="space-y-4 mb-8">
              {["Instantly correlates symptoms to known drug side-effects", "Ranks suspected culprits by probability score", "Suggests safer class alternatives immediately"].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>

            <form onSubmit={handleDetect} className="relative mb-6">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="E.g., Unexplained Bruising..."
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-32 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !symptom.trim()}
                className="absolute right-2 top-2 bottom-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 rounded-lg text-sm font-semibold transition-colors"
              >
                {isAnalyzing ? "Scanning..." : "Detect"}
              </button>
            </form>

            {!hasResult && !isAnalyzing && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 py-1">Try:</span>
                {sampleSymptoms.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymptom(sym)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full transition-colors border border-slate-700"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Activity className="w-8 h-8 text-indigo-500 animate-pulse mb-3" />
                  <p className="text-sm text-slate-400">Correlating symptom against patient medication history...</p>
                </motion.div>
              )}

              {hasResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                    <span>Suspected Culprit</span>
                    <span>Probability</span>
                  </div>

                  {/* Result 1 */}
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">1</div>
                        <div>
                          <h4 className="font-bold text-white text-base">Warfarin 5mg</h4>
                          <p className="text-xs text-slate-400">Current active prescription</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-red-400 font-bold text-lg">89%</span>
                      </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mb-3">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: "89%" }} transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                    
                    <div className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 mt-2 text-xs text-slate-300">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p>Patient is also taking Aspirin 81mg. The synergistic effect highly correlates with unexplained bruising/bleeding events.</p>
                    </div>
                  </div>

                  {/* Result 2 */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 opacity-75">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">2</div>
                        <div>
                          <h4 className="font-bold text-slate-200">Aspirin 81mg</h4>
                        </div>
                      </div>
                      <span className="text-amber-400 font-bold">42%</span>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
