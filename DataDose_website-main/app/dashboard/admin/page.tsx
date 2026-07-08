'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  Activity,
  Shield,
  Settings as SettingsIcon,
} from 'lucide-react';
import DashboardShell from '@/app/components/layout/DashboardShell';
import Settings from '@/app/components/layout/Settings';
import HospitalAnalytics from '@/app/components/admin/HospitalAnalytics';
import UserManagement from '@/app/components/admin/UserManagement';
import SafetyMonitoring from '@/app/components/admin/SafetyMonitoring';
import { containerVariants, itemVariants } from '@/app/components/shared/animations';
import { useAuth } from '@/app/context/AuthContext';

const menuItems = [
  { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
  { id: 'approvals', label: 'Pending Approvals', icon: <Shield className="w-5 h-5" /> },
  { id: 'activity', label: 'Hospital Activity', icon: <Activity className="w-5 h-5" /> },
  { id: 'safety', label: 'Safety Monitoring', icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

export default function AdminDashboard() {
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
              <h1 className="text-2xl font-bold text-slate-900">
                Hospital Administration
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                System Overview & Operations Dashboard. Select an administrative module from the sidebar.
              </p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'User Management',
                  desc: 'Review approved hospital staff accounts and manage departments.',
                  action: () => setActiveFeature('users'),
                  icon: <Users className="w-5 h-5 text-teal-600" />,
                  label: 'Manage Staff',
                },
                {
                  title: 'Pending Approvals',
                  desc: 'Verify and authorize credentials for registering physicians and pharmacists.',
                  action: () => setActiveFeature('approvals'),
                  icon: <Shield className="w-5 h-5 text-teal-600" />,
                  label: 'Review Credentials',
                },
                {
                  title: 'Safety Monitoring',
                  desc: 'Monitor prescription compliance, errors, and system activity logs.',
                  action: () => setActiveFeature('safety'),
                  icon: <AlertTriangle className="w-5 h-5 text-teal-600" />,
                  label: 'Open Audit',
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

            {/* Operational Highlights */}
            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 text-sm mb-3">Platform Performance Highlights</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Total API Load</p>
                  <p className="text-sm font-semibold text-teal-700 mt-0.5">Optimal</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Compliance Rate</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">100% Verified</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Database Cluster</p>
                  <p className="text-sm font-semibold text-teal-700 mt-0.5">Healthy</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">IT Audit Logs</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">Secured</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      case 'users':
        return <UserManagement showOnly="active" />;
      case 'approvals':
        return <UserManagement showOnly="pending" />;
      case 'activity':
        return <HospitalAnalytics />;
      case 'safety':
        return <SafetyMonitoring />;
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
      title="Hospital Administration"
    >
      {renderActiveFeature()}
    </DashboardShell>
  );
}
