'use client';

import { motion } from 'framer-motion';
import { Heart, Activity, AlertCircle, Calendar } from 'lucide-react';

export default function MyHealthProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
      id="profile"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Health Profile</h2>
        <Heart className="w-6 h-6 text-teal-600" />
      </div>

      <div className="space-y-6">
        {/* Vitals & Basics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold uppercase">Blood Type</p>
            <p className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              O+ <Activity className="w-4 h-4 text-rose-500" />
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold uppercase">Last Visit</p>
            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" /> Mar 12, 2026
            </p>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            Chronic Conditions
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
              <span className="font-medium text-blue-900">Chronic Kidney Disease (CKD)</span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">Stage 3a</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="font-medium text-slate-700">Peptic Ulcer</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold">Managed</span>
            </div>
          </div>
        </div>

        {/* Allergies / Contraindications */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Active Allergies
          </h3>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-red-900">Penicillin</p>
                <p className="text-xs text-red-700 mt-1">Severe anaphylactic reaction.</p>
              </div>
              <span className="bg-red-200 text-red-800 text-[10px] uppercase font-bold px-2 py-1 rounded">Critical</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
