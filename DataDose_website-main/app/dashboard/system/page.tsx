'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Settings,
  Zap,
  TrendingUp,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import SystemMonitoring from '@/app/components/superadmin/SystemMonitoring';
import KnowledgeDatabase from '@/app/components/superadmin/KnowledgeDatabase';
import PipelineStatus from '@/app/components/superadmin/PipelineStatus';

const sidebarItems = [
  {
    label: 'System Status',
    icon: <Server className="w-5 h-5" />,
    href: '#system',
  },
  {
    label: 'Subscriptions',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '#subscriptions',
    badge: 3,
  },
  {
    label: 'Knowledge Base',
    icon: <Database className="w-5 h-5" />,
    href: '#knowledge',
  },
  {
    label: 'Data Pipelines',
    icon: <Zap className="w-5 h-5" />,
    href: '#pipelines',
  },
  {
    label: 'Neo4j Graph',
    icon: <Activity className="w-5 h-5" />,
    href: '#graph',
  },
];

const stats = [
  {
    label: 'Active Instances',
    value: '24',
    icon: <Server className="w-6 h-6" />,
    gradient: 'from-teal-500 to-cyan-500',
    color: 'text-teal-600',
  },
  {
    label: 'Data Integrity',
    value: '100%',
    icon: <Database className="w-6 h-6" />,
    gradient: 'from-green-500 to-emerald-500',
    color: 'text-green-600',
  },
  {
    label: 'System Health',
    value: '98.5%',
    icon: <Activity className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600',
  },
  {
    label: 'API Calls/Hour',
    value: '12.4K',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    color: 'text-orange-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Super Admin Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">
            DataDose Platform Infrastructure & System Control
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="glass-card-strong rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-slate-600 text-sm font-medium">{stat.label}</h3>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Platform Management Workflow */}
        <motion.div variants={itemVariants} className="glass-card-strong rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Management Workflow</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, label: 'Super Admin Login', icon: '🔐' },
              { step: 2, label: 'System Dashboard', icon: '📊' },
              { step: 3, label: 'Subscription Mgmt', icon: '💳' },
              { step: 4, label: 'Database Admin', icon: '🗄️' },
              { step: 5, label: 'ML Pipelines', icon: '🔄' },
              { step: 6, label: 'Knowledge Graph', icon: '🧠' },
              { step: 7, label: 'System Alerts', icon: '⚠️' },
              { step: 8, label: 'Config & Deploy', icon: '🚀' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                {i < 7 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 w-4 h-px bg-gradient-teal opacity-50" />
                )}

                <div className="glass-card rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-slate-700 text-sm">{item.label}</p>
                  <div className="text-xs text-teal-600 font-bold mt-2">Step {item.step}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Components */}
        <motion.div variants={itemVariants} className="space-y-6">
          <SystemMonitoring />
          <PipelineStatus />
          <KnowledgeDatabase />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
