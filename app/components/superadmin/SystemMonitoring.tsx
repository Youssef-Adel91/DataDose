'use client';

import { motion } from 'framer-motion';
import { Server, HardDrive, Wifi, Zap, AlertTriangle } from 'lucide-react';

const systemMetrics = [
  {
    name: 'Primary Server',
    status: 'Online',
    cpu: '34%',
    memory: '62%',
    uptime: '99.9%',
  },
  {
    name: 'Database Server',
    status: 'Online',
    cpu: '28%',
    memory: '78%',
    uptime: '99.8%',
  },
  {
    name: 'API Gateway',
    status: 'Online',
    cpu: '41%',
    memory: '52%',
    uptime: '100%',
  },
  {
    name: 'Cache Server',
    status: 'Online',
    cpu: '12%',
    memory: '91%',
    uptime: '99.6%',
  },
];

const systemAlerts = [
  {
    id: 1,
    level: 'warning',
    message: 'Database Server memory usage approaching threshold',
    time: '10 min ago',
  },
  {
    id: 2,
    level: 'info',
    message: 'Scheduled backup completed successfully',
    time: '2 hours ago',
  },
  {
    id: 3,
    level: 'critical',
    message: 'API response time degradation detected',
    time: '3 hours ago',
  },
];

export default function SystemMonitoring() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
      id="system"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">System Monitoring</h2>
        <Server className="w-6 h-6 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {systemMetrics.map((server, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="bg-white/50 border border-slate-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-teal rounded-lg">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{server.name}</p>
                  <p
                    className={`text-xs font-bold ${
                      server.status === 'Online' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {server.status}
                  </p>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">CPU Usage</span>
                <span className="font-semibold text-slate-900">{server.cpu}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-teal h-2 rounded-full"
                  style={{ width: server.cpu }}
                />
              </div>

              <div className="flex justify-between text-sm mt-3">
                <span className="text-slate-600">Memory</span>
                <span className="font-semibold text-slate-900">{server.memory}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`${parseInt(server.memory) > 80 ? 'bg-orange-500' : 'bg-mint-500'} h-2 rounded-full`}
                  style={{ width: server.memory }}
                />
              </div>

              <div className="flex justify-between text-sm mt-3">
                <span className="text-slate-600">Uptime</span>
                <span className="font-semibold text-green-600">{server.uptime}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Alerts */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          System Alerts
        </h3>

        <div className="space-y-2">
          {systemAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`p-3 rounded-lg ${
                alert.level === 'critical'
                  ? 'bg-red-50 border border-red-200'
                  : alert.level === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <p
                  className={`text-sm font-semibold ${
                    alert.level === 'critical'
                      ? 'text-red-700'
                      : alert.level === 'warning'
                        ? 'text-yellow-700'
                        : 'text-blue-700'
                  }`}
                >
                  {alert.message}
                </p>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{alert.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
