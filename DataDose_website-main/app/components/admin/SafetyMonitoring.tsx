'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const safetyEvents = [
  {
    id: 1,
    type: 'critical',
    event: 'High-risk drug interaction detected',
    medication: 'Warfarin + NSAIDs',
    department: 'Cardiology',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'warning',
    event: 'Dosage exceeds recommended limit',
    medication: 'Metformin 2000mg',
    department: 'Endocrinology',
    time: '4 hours ago',
  },
  {
    id: 3,
    type: 'info',
    event: 'Controlled substance dispensing',
    medication: 'Oxycodone',
    department: 'Pain Management',
    time: '6 hours ago',
  },
  {
    id: 4,
    type: 'success',
    event: 'Prescription safely completed',
    medication: 'Metformin + Lisinopril',
    department: 'Internal Medicine',
    time: '8 hours ago',
  },
];

const typeConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🔵' },
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' },
};

const safetyMetrics = [
  { label: 'Prevented Incidents', value: '127', color: 'text-green-600' },
  { label: 'Total Alerts', value: '342', color: 'text-orange-600' },
  { label: 'Critical Events', value: '8', color: 'text-red-600' },
  { label: 'Safety Score', value: '96%', color: 'text-teal-600' },
];

export default function SafetyMonitoring() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-strong rounded-xl p-8"
      id="safety"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Safety Monitoring</h2>
        <AlertTriangle className="w-6 h-6 text-orange-600" />
      </div>

      {/* Safety Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {safetyMetrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i }}
            className="bg-white/50 rounded-lg p-4 border border-slate-200 text-center"
          >
            <p className="text-xs text-slate-600 font-medium mb-2">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Safety Events Log */}
      <div className="space-y-3">
        {safetyEvents.map((event, i) => {
          const config = typeConfig[event.type as keyof typeof typeConfig];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`${config.bg} border ${config.border} rounded-lg p-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl mt-1">{config.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${config.text} mb-1`}>{event.event}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium">Drug:</span> {event.medication}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium">Dept:</span> {event.department}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500 font-medium">{event.time}</p>
                  {event.type === 'critical' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="mt-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded"
                    >
                      Investigate
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
