"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, AlertTriangle, CheckCircle } from "lucide-react";
import SmartAlternatives from "./SmartAlternatives";

export default function InteractiveDemo() {
  const [step, setStep] = useState(0);

  const simulateAnalysis = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2000);
  };

  return (
    <section id="interactive-demo" className="py-24 bg-slate-900 border-t border-slate-800 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <span className="inline-block text-teal-500 text-xs font-bold tracking-widest uppercase mb-3">Live Sandbox</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Try the AI Engine
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Experience how quickly DataDose identifies critical interactions and finds safe alternatives.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Left: Input */}
          <div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:p-8">
              <h3 className="text-white font-bold text-lg mb-6">1. Enter Prescription Data</h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-2">Patient Profile</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">
                    Male, 68 yrs • History: Atrial Fibrillation, Hypertension
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-400 text-xs font-semibold block mb-2">Current Active Medications</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm flex gap-2">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">Aspirin 81mg</span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">Lisinopril 10mg</span>
                  </div>
                </div>

                <div>
                  <label className="text-teal-400 text-xs font-semibold block mb-2">New Prescription to Add</label>
                  <input 
                    type="text" 
                    value="Warfarin 5mg" 
                    readOnly
                    className="w-full bg-slate-900 border border-teal-500/50 rounded-lg p-3 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={simulateAnalysis}
                disabled={step !== 0}
                className="w-full gradient-teal text-white font-bold text-sm py-4 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 0 ? <><Play className="w-4 h-4 fill-white" /> Run Safety Analysis</> : "Analysis Complete"}
              </button>
            </div>
          </div>

          {/* Right: Output */}
          <div className="relative">
            {step === 0 && (
              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 font-medium">
                Waiting for input...
              </div>
            )}

            {step === 1 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 rounded-2xl border border-slate-700">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-teal-400 font-medium animate-pulse">Scanning knowledge graph...</p>
              </div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-2xl border border-red-500/50 p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">🔴</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-red-500 font-bold text-lg leading-tight">SEVERE CONTRAINDICATION</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">SEVERE</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">Identified in &lt; 0.2s via N-Degree Scan</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-md border border-slate-700">Warfarin</div>
                    <div className="h-px w-8 bg-red-500 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"><AlertTriangle className="w-2.5 h-2.5 text-white" /></div>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-md border border-slate-700">Aspirin</div>
                  </div>
                  <p className="text-sm text-slate-300 text-center leading-relaxed">
                    Concurrent use of Warfarin and Aspirin significantly increases risk of major bleeding events. Generally contraindicated unless strictly monitored.
                  </p>
                </div>

                <div className="flex gap-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">Safe Replacements</div>
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-emerald-400 font-bold block leading-tight">Apixaban (Eliquis)</span>
                        <span className="text-slate-400 text-[10px]">Alternative anticoagulant</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-md transition-colors">Select</button>
                  </div>
                </div>

              </motion.div>
            )}
          </div>

        </div>
        
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <SmartAlternatives />
          </motion.div>
        )}

      </div>
    </section>
  );
}
