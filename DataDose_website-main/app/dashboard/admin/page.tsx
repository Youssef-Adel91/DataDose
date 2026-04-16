'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  AlertTriangle,
  Activity,
  Download,
  TrendingUp,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import HospitalAnalytics from '@/app/components/admin/HospitalAnalytics';
import UserManagement from '@/app/components/admin/UserManagement';
import SafetyMonitoring from '@/app/components/admin/SafetyMonitoring';

const sidebarItems = [
  {
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '#analytics',
  },
  {
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
    href: '#users',
    badge: 5,
  },
  {
    label: 'Safety Monitoring',
    icon: <AlertTriangle className="w-5 h-5" />,
    href: '#safety',
  },
  {
    label: 'Clinical Reports',
    icon: <Activity className="w-5 h-5" />,
    href: '#reports',
  },
  {
    label: 'API Integration',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '#api',
  },
];

const stats = [
  {
    label: 'Total Users',
    value: '248',
    icon: <Users className="w-6 h-6" />,
    gradient: 'from-teal-500 to-cyan-500',
    color: 'text-teal-600',
  },
  {
    label: 'Prescriptions Processed',
    value: '1,247',
    icon: <BarChart3 className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600',
  },
  {
    label: 'Safety Incidents',
    value: '2',
    icon: <AlertTriangle className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    color: 'text-orange-600',
  },
  {
    label: 'System Uptime',
    value: '99.9%',
    icon: <Activity className="w-6 h-6" />,
    gradient: 'from-green-500 to-emerald-500',
    color: 'text-green-600',
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

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Enterprise Admin Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900">Enterprise Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Hospital-Wide Medication Safety Monitoring and Analytics
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
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-slate-600 text-sm font-medium">{stat.label}</h3>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Administrative Workflow */}
        <motion.div variants={itemVariants} className="glass-card-strong rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Enterprise Workflow</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, label: 'Admin Login', icon: '🔐' },
              { step: 2, label: 'Dashboard Access', icon: '📊' },
              { step: 3, label: 'User Monitoring', icon: '👥' },
              { step: 4, label: 'Activity Tracking', icon: '📈' },
              { step: 5, label: 'Safety Alerts', icon: '⚠️' },
              { step: 6, label: 'Reports Export', icon: '📄' },
              { step: 7, label: 'API Management', icon: '🔌' },
              { step: 8, label: 'System Config', icon: '⚙️' },
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
          <HospitalAnalytics />
          <UserManagement />
          <SafetyMonitoring />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
