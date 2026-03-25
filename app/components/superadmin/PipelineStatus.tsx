'use client';

import { motion } from 'framer-motion';
import { Zap, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const pipelines = [
  {
    name: 'Drug Database Sync',
    status: 'running',
    progress: 87,
    duration: '2h 14m',
    nextRun: 'In 6 hours',
  },
  {
    name: 'ML Model Training',
    status: 'completed',
    progress: 100,
    duration: '12h 45m',
    nextRun: 'In 24 hours',
  },
  {
    name: 'Clinical Data ETL',
    status: 'running',
    progress: 45,
    duration: '1h 23m',
    nextRun: 'In 12 hours',
  },
  {
    name: 'Knowledge Graph Update',
    status: 'scheduled',
    progress: 0,
    duration: '---',
    nextRun: 'In 2 hours',
  },
];

const statusConfig = {
  running: { color: 'text-blue-700', bg: 'bg-blue-50', icon: '⚙️' },
  completed: { color: 'text-green-700', bg: 'bg-green-50', icon: '✅' },
  scheduled: { color: 'text-yellow-700', bg: 'bg-yellow-50', icon: '📅' },
};

export default function PipelineStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-strong rounded-xl p-8"
      id="pipelines"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Airflow Pipelines</h2>
        <Zap className="w-6 h-6 text-teal-600" />
      </div>

      <div className="space-y-4">
        {pipelines.map((pipeline, i) => {
          const config = statusConfig[pipeline.status as keyof typeof statusConfig];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`${config.bg} border border-opacity-50 rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{pipeline.name}</p>
                    <p className={`text-xs font-bold capitalize ${config.color}`}>
                      {pipeline.status}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p className="font-semibold">{pipeline.duration}</p>
                  <p className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {pipeline.nextRun}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-700">Progress</span>
                  <span className="font-bold text-slate-900">{pipeline.progress}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pipeline.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-teal rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-teal-700" />
          <p className="text-sm font-semibold text-teal-900">All pipelines operational</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded"
        >
          View Logs
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
