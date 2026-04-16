'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const alerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Controlled Drug Dispensing',
    message: 'Oxycodone requires DEA Form 222 verification',
    time: '5 min ago',
    resolved: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Allergy Alert',
    message: 'Patient has penicillin allergy. Verify non-beta-lactam prescription.',
    time: '12 min ago',
    resolved: false,
  },
  {
    id: 3,
    type: 'info',
    title: 'Quantity Verification',
    message: 'Prescription quantity exceeds 90-day supply. Confirm with patient.',
    time: '35 min ago',
    resolved: false,
  },
  {
    id: 4,
    type: 'success',
    title: 'Dispensing Completed',
    message: 'Metformin 500mg dispensed successfully. Patient counseled.',
    time: '2 hours ago',
    resolved: true,
  },
];

const typeConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🔵' },
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' },
};

export default function DrugAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-strong rounded-xl p-8"
      id="alerts"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Active Alerts</h2>
        <motion.div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-red-500 rounded-full opacity-30 animate-pulse" />
          <div className="absolute inset-2 bg-red-500 rounded-full" />
        </motion.div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const config = typeConfig[alert.type as keyof typeof typeConfig];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`${config.bg} border ${config.border} rounded-lg p-4 ${
                alert.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl mt-0.5 flex-shrink-0">{config.icon}</div>
                <div className="flex-1">
                  <p className={`font-semibold ${config.text}`}>{alert.title}</p>
                  <p className="text-sm text-slate-700 mt-1">{alert.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.time}
                  </span>
                  {alert.resolved && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {!alert.resolved && (
                <div className="mt-3 pt-3 border-t border-current opacity-20 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="text-xs font-semibold px-3 py-1 bg-white rounded hover:bg-slate-100 transition"
                  >
                    Action
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="text-xs font-semibold px-3 py-1 bg-white rounded hover:bg-slate-100 transition"
                  >
                    Dismiss
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
