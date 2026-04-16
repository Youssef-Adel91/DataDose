'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Bell } from 'lucide-react';

const interactions = [
  {
    id: 1,
    drug1: 'Simvastatin',
    drug2: 'Amiodarone',
    severity: 'fatal',
    description: 'Significantly increased risk of myopathy or rhabdomyolysis.',
  },
  {
    id: 2,
    drug1: 'Warfarin',
    drug2: 'Aspirin',
    severity: 'severe',
    description: 'Increased risk of bleeding due to additive effects.',
  },
  {
    id: 3,
    drug1: 'Metformin',
    drug2: 'Contrast dye',
    severity: 'major',
    description: 'Risk of lactic acidosis if eGFR is severely reduced.',
  },
  {
    id: 4,
    drug1: 'Lisinopril',
    drug2: 'Ibuprofen',
    severity: 'minor',
    description: 'May decrease antihypertensive effect.',
  },
];

const severityConfig = {
  fatal: { bg: 'bg-zinc-900', border: 'border-zinc-700', text: 'text-white', badge: 'bg-zinc-800 text-white', icon: '⬛' },
  severe: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500 text-white', icon: '🔴' },
  major: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-400 text-white', icon: '🟠' },
  minor: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-400 text-slate-800', icon: '🟡' },
  safe: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500 text-white', icon: '🟢' },
};

export default function DrugInteractionChecker() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-strong rounded-xl p-8"
      id="interactions"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Drug Interaction Analysis</h2>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-2xl"
        >
          ⚗️
        </motion.div>
      </div>

      <div className="space-y-4">
        {interactions.map((interaction, i) => {
          const config = severityConfig[interaction.severity as keyof typeof severityConfig];
          return (
            <motion.div
              key={interaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ x: 4 }}
              className={`${config.bg} border ${config.border} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">{config.icon}</div>
                <div className="flex-1">
                  <p className={`font-semibold ${config.text}`}>
                    {interaction.drug1} + {interaction.drug2}
                  </p>
                  <p className={`text-sm mt-1 ${interaction.severity === 'fatal' ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {interaction.description}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                      {interaction.severity.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <Bell className={`w-5 h-5 ${config.text}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-900">Safety Recommendation</p>
            <p className="text-sm text-orange-800 mt-1">
              Overall risk: <span className="font-bold">HIGH</span>. 
              Fatal interaction detected. Do not dispense Simvastatin with Amiodarone without consulting the prescriber.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
