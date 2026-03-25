'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardList,
  AlertCircle,
  BarChart3,
  Zap,
  CheckCircle,
  Network,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientEHR from '@/app/components/physician/PatientEHR';
import PrescriptionCreator from '@/app/components/physician/PrescriptionCreator';
import RiskAnalysis from '@/app/components/physician/RiskAnalysis';
import PolypharmacyScan from '@/app/components/PolypharmacyScan';
import SmartAlternatives from '@/app/components/SmartAlternatives';
import VisualPrescriptionMap from '@/app/components/VisualPrescriptionMap';

const sidebarItems = [
  {
    label: 'Patient Records',
    icon: <Users className="w-5 h-5" />,
    href: '#patients',
    badge: 12,
  },
  {
    label: 'Create Prescription',
    icon: <ClipboardList className="w-5 h-5" />,
    href: '#prescription',
  },
  {
    label: 'N-Degree Scanner',
    icon: <Network className="w-5 h-5" />,
    href: '#polypharmacy-scan',
    badge: 1,
  },
  {
    label: 'Smart Alternatives',
    icon: <RefreshCw className="w-5 h-5" />,
    href: '#smart-alternatives',
  },
  {
    label: 'Visual Map',
    icon: <GitBranch className="w-5 h-5" />,
    href: '#visual-map',
  },
  {
    label: 'Risk Analysis',
    icon: <AlertCircle className="w-5 h-5" />,
    href: '#risk',
    badge: 3,
  },
  {
    label: 'Clinical Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '#reports',
  },
];

const stats = [
  {
    label: 'Active Patients',
    value: '48',
    icon: <Users className="w-6 h-6" />,
    gradient: 'from-teal-500 to-cyan-500',
    color: 'text-teal-600',
  },
  {
    label: 'Prescriptions Today',
    value: '16',
    icon: <ClipboardList className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600',
  },
  {
    label: 'Risk Alerts',
    value: '3',
    icon: <AlertCircle className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    color: 'text-orange-600',
  },
  {
    label: 'Treatment Accuracy',
    value: '98%',
    icon: <CheckCircle className="w-6 h-6" />,
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

export default function PhysicianDashboard() {
  const [scannedDrugs, setScannedDrugs] = useState<string[]>([]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Physician Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900">Physician Dashboard</h1>
          <p className="text-slate-600 mt-2">
            AI-Powered Clinical Decision Support for Safe Treatment Planning
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
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-slate-600 text-sm font-medium">{stat.label}</h3>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Clinical Workflow */}
        <motion.div variants={itemVariants} className="glass-card-strong rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Clinical Decision Workflow</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, label: 'Patient Login', icon: '👨‍⚕️' },
              { step: 2, label: 'Select Patient', icon: '📋' },
              { step: 3, label: 'Open EHR', icon: '📁' },
              { step: 4, label: 'Review History', icon: '📊' },
              { step: 5, label: 'Create Prescription', icon: '✍️' },
              { step: 6, label: 'Risk Analysis', icon: '⚠️' },
              { step: 7, label: 'AI Recommendations', icon: '🤖' },
              { step: 8, label: 'Approve & Save', icon: '✓' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                {/* Arrow connector */}
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
          <PatientEHR />
          <PrescriptionCreator />
          <PolypharmacyScan onScanComplete={setScannedDrugs} />
          <SmartAlternatives />
          <VisualPrescriptionMap scannedDrugs={scannedDrugs} />
          <RiskAnalysis />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
