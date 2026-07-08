'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pill,
  AlertTriangle,
  Clock,
  Network,
  GitBranch,
  ScanLine,
  Bot,
  Settings as SettingsIcon,
} from 'lucide-react';
import DashboardShell from '@/app/components/layout/DashboardShell';
import Settings from '@/app/components/layout/Settings';
import OCRScanner from '@/app/components/OCRScanner';
import DrugInteractionChecker from '@/app/components/pharmacist/DrugInteractionChecker';
import DrugAlerts from '@/app/components/pharmacist/DrugAlerts';
import dynamic from 'next/dynamic';
import PolypharmacyScan from '@/app/components/PolypharmacyScan';

const VisualPrescriptionMap = dynamic(
  () => import('@/app/components/VisualPrescriptionMap'),
  { ssr: false }
);
import GraphRAGChatbot from '@/app/components/GraphRAGChatbot';
import { containerVariants, itemVariants } from '@/app/components/shared/animations';
import { useAuth } from '@/app/context/AuthContext';

const menuItems = [
  { id: 'review', label: 'Prescription Review', icon: <Clock className="w-5 h-5" /> },
  { id: 'ocr', label: 'OCR Scanner', icon: <ScanLine className="w-5 h-5" /> },
  { id: 'checker', label: 'Drug Interaction Checker', icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'polypharmacy', label: 'Polypharmacy Scanner', icon: <Network className="w-5 h-5" /> },
  { id: 'map', label: 'Visual Map', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'ai', label: 'Clinical AI', icon: <Bot className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [scannedDrugs, setScannedDrugs] = useState<string[]>([]);
  const [ocrDrugs, setOcrDrugs] = useState<string[]>([]);

  // Helper to render active tool/view
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
                Welcome, {user?.name || 'Pharmacist'}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Hospital Medication Verification Portal. Select a clinical tool from the sidebar to begin.
              </p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Prescription Review',
                  desc: 'Review incoming medication orders and verify DEA Forms.',
                  action: () => setActiveFeature('review'),
                  icon: <Clock className="w-5 h-5 text-teal-600" />,
                  label: 'Review Queue',
                },
                {
                  title: 'Rx Scanner (OCR)',
                  desc: 'Scan printed or handwritten prescriptions to extract medication names.',
                  action: () => setActiveFeature('ocr'),
                  icon: <ScanLine className="w-5 h-5 text-teal-600" />,
                  label: 'Scan Rx Image',
                },
                {
                  title: 'Interaction Checker',
                  desc: 'Perform multi-drug safety checks and scan contraindications.',
                  action: () => setActiveFeature('polypharmacy'),
                  icon: <Network className="w-5 h-5 text-teal-600" />,
                  label: 'Open Checker',
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

            {/* Safety Notice */}
            <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Critical Dispensing Reminder</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Verify all high-risk drug pairs (e.g. Amiodarone + Simvastatin) directly with the prescribing physician. Check patient EHR allergy records before dispensing beta-lactam antibiotics.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      case 'review':
        return <DrugAlerts />;
      case 'ocr':
        return <OCRScanner onSendToScanner={setOcrDrugs} />;
      case 'checker':
        return <DrugInteractionChecker />;
      case 'polypharmacy':
        return (
          <PolypharmacyScan
            onScanComplete={setScannedDrugs}
            injectDrugs={ocrDrugs}
          />
        );
      case 'map':
        return <VisualPrescriptionMap scannedDrugs={scannedDrugs} />;
      case 'ai':
        return <GraphRAGChatbot currentMedications={scannedDrugs} />;
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
      title="Pharmacist Portal"
    >
      {renderActiveFeature()}
    </DashboardShell>
  );
}
