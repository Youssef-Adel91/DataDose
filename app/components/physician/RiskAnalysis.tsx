'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

const risks = [
  {
    id: 1,
    category: 'Drug Interaction',
    severity: 'medium',
    description: 'Metformin + ACE Inhibitor interaction detected',
    recommendation: 'Monitor renal function - recommend baseline kidney test',
  },
  {
    id: 2,
    category: 'Contraindication',
    severity: 'low',
    description: 'Patient reported allergy to Beta-blockers',
    recommendation: 'Use alternative CCB (Calcium Channel Blocker) class',
  },
  {
    id: 3,
    category: 'Dosage Alert',
    severity: 'high',
    description: 'Recommended dose exceeds safe limit for age group',
    recommendation: 'Reduce dose to 50% - renal function compromised',
  },
];

const severityConfig = {
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100',
  },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
};

export default function RiskAnalysis() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-strong rounded-xl p-8"
      id="risk"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Clinical Risk Analysis</h2>
        <TrendingUp className="w-6 h-6 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Risk Score', value: '4.2/10', color: 'text-yellow-600' },
          { label: 'Safety Level', value: 'MODERATE', color: 'text-yellow-600' },
          { label: 'Recommendation', value: 'Proceed with caution', color: 'text-blue-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white/50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-600 font-medium">{item.label}</p>
            <p className={`text-lg font-bold ${item.color} mt-2`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {risks.map((risk, i) => {
          const config = severityConfig[risk.severity as keyof typeof severityConfig];
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`${config.bg} border ${config.border} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${config.text} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`font-semibold ${config.text}`}>{risk.category}</p>
                    <span className={`${config.badge} text-xs font-bold px-2 py-1 rounded`}>
                      {risk.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{risk.description}</p>
                  <div className="bg-white/50 rounded p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Recommendation:</p>
                    <p className="text-sm text-slate-700">✓ {risk.recommendation}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
      >
        <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-900">AI Assessment Complete</p>
          <p className="text-sm text-green-800 mt-1">
            All risks have been analyzed. Safe to proceed with physician review.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
