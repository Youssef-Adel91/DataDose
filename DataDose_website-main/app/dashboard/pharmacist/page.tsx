'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pill,
  AlertTriangle,
  Clock,
  FileText,
  Zap,
  TrendingUp,
  Network,
  GitBranch,
  ScanLine,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import OCRScanner from '@/app/components/OCRScanner';
import DrugInteractionChecker from '@/app/components/pharmacist/DrugInteractionChecker';
import DrugAlerts from '@/app/components/pharmacist/DrugAlerts';
import PolypharmacyScan from '@/app/components/PolypharmacyScan';
import VisualPrescriptionMap from '@/app/components/VisualPrescriptionMap';
import GraphRAGChatbot from '@/app/components/GraphRAGChatbot';

const sidebarItems = [
  {
    label: 'AI Rx Scanner',
    icon: <ScanLine className="w-5 h-5" />,
    href: '#ocr-scanner',
  },
  {
    label: 'N-Degree Scanner',
    icon: <Network className="w-5 h-5" />,
    href: '#polypharmacy-scan',
    badge: 1,
  },
  {
    label: 'Drug Interactions',
    icon: <AlertTriangle className="w-5 h-5" />,
    href: '#interactions',
  },
  {
    label: 'Alternative Drugs',
    icon: <Pill className="w-5 h-5" />,
    href: '#alternatives',
  },
  {
    label: 'Visual Map',
    icon: <GitBranch className="w-5 h-5" />,
    href: '#visual-map',
  },
  {
    label: 'Controlled Drugs',
    icon: <Clock className="w-5 h-5" />,
    href: '#controlled',
  },
  {
    label: 'Alerts Panel',
    icon: <AlertTriangle className="w-5 h-5" />,
    href: '#alerts',
    badge: 5,
  },
];

const stats = [
  {
    label: 'Prescriptions Today',
    value: '24',
    icon: <Pill className="w-6 h-6" />,
    gradient: 'from-teal-500 to-cyan-500',
    color: 'text-teal-600',
  },
  {
    label: 'Interactions Detected',
    value: '3',
    icon: <AlertTriangle className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
    color: 'text-orange-600',
  },
  {
    label: 'Avg Processing Time',
    value: '45ms',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600',
  },
  {
    label: 'Risk Prevention',
    value: '100%',
    icon: <TrendingUp className="w-6 h-6" />,
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

export default function PharmacistDashboard() {
  const [scannedDrugs, setScannedDrugs] = useState<string[]>([]);
  const [ocrDrugs, setOcrDrugs] = useState<string[]>([]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Pharmacist Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900">Pharmacist Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Smart Clinical Decision Support for Safer Medication Dispensing
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

        {/* Workflow Section */}
        <motion.div variants={itemVariants} className="glass-card-strong rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Prescription Processing Workflow
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, label: 'Login', icon: '👤' },
              { step: 2, label: 'Enter/Scan Prescription', icon: '📝' },
              { step: 3, label: 'OCR Processing', icon: '🔍' },
              { step: 4, label: 'Drug Interaction Check', icon: '⚗️' },
              { step: 5, label: 'Risk Detection', icon: '⚠️' },
              { step: 6, label: 'Alert System', icon: '🔔' },
              { step: 7, label: 'Alternatives Found', icon: '💊' },
              { step: 8, label: 'Dispense & Record', icon: '✓' },
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
          <OCRScanner onSendToScanner={setOcrDrugs} />
          <PolypharmacyScan
            onScanComplete={setScannedDrugs}
            injectDrugs={ocrDrugs}
          />
          <DrugInteractionChecker />
          <DrugAlerts />
          <VisualPrescriptionMap scannedDrugs={scannedDrugs} />
          <GraphRAGChatbot currentMedications={scannedDrugs} />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
