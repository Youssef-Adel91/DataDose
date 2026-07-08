'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Zap,
  Settings as SettingsIcon,
} from 'lucide-react';
import DashboardShell from '@/app/components/layout/DashboardShell';
import Settings from '@/app/components/layout/Settings';
import SystemMonitoring from '@/app/components/superadmin/SystemMonitoring';
import KnowledgeDatabase from '@/app/components/superadmin/KnowledgeDatabase';
import PipelineStatus from '@/app/components/superadmin/PipelineStatus';
import { containerVariants, itemVariants } from '@/app/components/shared/animations';
import { useAuth } from '@/app/context/AuthContext';

const menuItems = [
  { id: 'knowledge', label: 'Knowledge Database', icon: <Database className="w-5 h-5" /> },
  { id: 'pipelines', label: 'Pipeline Status', icon: <Zap className="w-5 h-5" /> },
  { id: 'monitoring', label: 'System Status', icon: <Server className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState('dashboard');

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'dashboard':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants}>
              <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Super Admin Console. Manage clinical knowledge databases, data parsing pipelines, and monitor overall health status.
              </p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Knowledge Database',
                  desc: 'Review medical active ingredients, drug-to-drug interactions, and clinical relationships.',
                  action: () => setActiveFeature('knowledge'),
                  icon: <Database className="w-5 h-5 text-teal-600" />,
                  label: 'Open Database',
                },
                {
                  title: 'Pipeline Status',
                  desc: 'Monitor EHR integrations, batch data extraction jobs, and sync health logs.',
                  action: () => setActiveFeature('pipelines'),
                  icon: <Zap className="w-5 h-5 text-teal-600" />,
                  label: 'Open Pipelines',
                },
                {
                  title: 'System Monitoring',
                  desc: 'Track network load, active service pods, container health, and IT audit logs.',
                  action: () => setActiveFeature('monitoring'),
                  icon: <Server className="w-5 h-5 text-teal-600" />,
                  label: 'Open Monitoring',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-1.5 bg-teal-50 rounded-lg">{item.icon}</div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
                  </div>
                  <button
                    onClick={item.action}
                    className="mt-3 w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition cursor-pointer text-center"
                  >
                    {item.label}
                  </button>
                </div>
              ))}
            </motion.div>
          </motion.div>
        );
      case 'knowledge':
        return <KnowledgeDatabase />;
      case 'pipelines':
        return <PipelineStatus />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      menuItems={menuItems}
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      title="System Administration"
    >
      {renderActiveFeature()}
    </DashboardShell>
  );
}
