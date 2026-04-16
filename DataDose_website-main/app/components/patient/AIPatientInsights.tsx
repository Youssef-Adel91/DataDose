'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Info, ShieldCheck, Pill, ArrowRight } from 'lucide-react';

export default function AIPatientInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-strong rounded-xl p-8 h-full"
      id="insights"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Clinical Insights</h2>
          <p className="text-sm text-slate-500 mt-1">How DataDose keeps your treatments safe</p>
        </div>
        <div className="p-3 bg-teal-50 rounded-full">
          <Lightbulb className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Insight Card 1 */}
        <div className="relative pl-6 border-l-2 border-teal-400">
          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Amoxicillin Blocked
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            During your last visit, your physician attempted to prescribe <strong>Amoxicillin</strong> for your respiratory infection. 
            However, our AI Clinical Engine immediately blocked this prescription safely in the background because of your 
            severe <strong>Penicillin allergy</strong>.
          </p>
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Alternative Automatically Recommended</p>
                <p className="text-xs text-emerald-700">Azithromycin 250mg</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Insight Card 2 */}
        <div className="relative pl-6 border-l-2 border-blue-400">
          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            NSAID Adjustment for CKD
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Pain management medications (like Ibuprofen) can worsen <strong>Chronic Kidney Disease</strong> over time. 
            When your specialist updated your file last month, DataDose re-evaluated your active treatments and alerted your 
            pharmacist to avoid NSAIDs for your joint pain, choosing a kidney-safe alternative instead.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
