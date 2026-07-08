'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardList,
  AlertCircle,
  Network,
  RefreshCw,
  Microscope,
  GitBranch,
  Bot,
  ScanLine,
  Settings as SettingsIcon,
} from 'lucide-react';
import DashboardShell from '@/app/components/layout/DashboardShell';
import Settings from '@/app/components/layout/Settings';
import PatientEHR from '@/app/components/physician/PatientEHR';
import PrescriptionCreator from '@/app/components/physician/PrescriptionCreator';
import RiskAnalysis from '@/app/components/physician/RiskAnalysis';
import PolypharmacyScan from '@/app/components/PolypharmacyScan';
import SmartAlternatives from '@/app/components/SmartAlternatives';
import dynamic from 'next/dynamic';
import ReverseSymptomTracer from '@/app/components/ReverseSymptomTracer';

const VisualPrescriptionMap = dynamic(
  () => import('@/app/components/VisualPrescriptionMap'),
  { ssr: false }
);
import GraphRAGChatbot from '@/app/components/GraphRAGChatbot';
import OCRScanner from '@/app/components/OCRScanner';
import { containerVariants, itemVariants } from '@/app/components/shared/animations';
import { useAuth } from '@/app/context/AuthContext';

const menuItems = [
  { id: 'patients', label: 'Patient Records', icon: <Users className="w-5 h-5" /> },
  { id: 'prescription', label: 'Create Prescription', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'interactions', label: 'Interaction Checker', icon: <Network className="w-5 h-5" /> },
  { id: 'ocr', label: 'OCR Scanner', icon: <ScanLine className="w-5 h-5" /> },
  { id: 'alternatives', label: 'Smart Alternatives', icon: <RefreshCw className="w-5 h-5" /> },
  { id: 'symptoms', label: 'Symptom Tracer', icon: <Microscope className="w-5 h-5" /> },
  { id: 'map', label: 'Visual Map', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'risk', label: 'Risk Analysis', icon: <AlertCircle className="w-5 h-5" /> },
  { id: 'ai', label: 'Clinical AI', icon: <Bot className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

export default function PhysicianDashboard() {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [scannedDrugs, setScannedDrugs] = useState<string[]>([]);
  const [ocrDrugs, setOcrDrugs] = useState<string[]>([]);
  const [risks, setRisks] = useState<any[] | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [scanError, setScanError] = useState('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const handleCheckInteractions = async (drugs: any[]) => {
    setIsCheckingInteractions(true);
    setScanError('');
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugs: drugs.map((d: any) => d.name),
          patientEmail: selectedPatient?.email,
          conditions: selectedPatient?.condition
            ? String(selectedPatient.condition).split(',').map((c: string) => c.trim())
            : [],
        }),
      });
      const result = await response.json();
      if (response.status === 403 && result?.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        setRisks([]);
        return { ok: false, message: result?.message || 'Scan limit reached.' };
      }
      if (response.status === 503 && result?.error === 'AI_GRAPH_ENGINE_OFFLINE') {
        setRisks([]);
        setScanError(result?.message || 'Clinical analysis engine is offline.');
        return { ok: false, message: result?.message };
      }
      if (!response.ok) {
        setRisks([]);
        setScanError(result?.message || 'Scan failed.');
        return { ok: false, message: result?.message || 'Scan failed.' };
      }
      setQuotaExceeded(false);

      const drugNames = drugs.map((d: any) => d.name.toLowerCase());
      setScannedDrugs(drugNames);
      if (result?.interactions?.length) {
        const mappedRisks = result.interactions.map((item: any, index: number) => ({
          id: index + 1,
          category: 'Drug Interaction',
          severity: item.severity === 'fatal' || item.severity === 'severe' ? 'high' : 'medium',
          description: item.mechanism || item.pair || 'Potential interaction detected.',
          recommendation: item.recommendation || 'Review therapy before dispensing.',
        }));
        setRisks(mappedRisks);
        const critical = mappedRisks.some((risk: any) => risk.severity === 'high');
        return { ok: true, hasCriticalRisk: critical };
      } else {
        setRisks(null);
        return { ok: response.ok, hasCriticalRisk: false };
      }
    } catch {
      setRisks([]);
      return { ok: false, message: 'Interaction check failed. Please retry.' };
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleVerifySubmit = async (drugs: any[]) => {
    try {
      const response = await fetch('/api/prescriptions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: selectedPatient?.email,
          medications: drugs,
        }),
      });
      const result = await response.json();
      if (response.status === 403 && result?.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        return { ok: false, quotaExceeded: true, message: result.message };
      }
      if (!response.ok) {
        return { ok: false, message: result?.message || 'Unable to submit prescription.' };
      }
      return { ok: true, message: result?.message || 'Prescription submitted successfully.' };
    } catch {
      return { ok: false, message: 'Unable to submit prescription.' };
    }
  };

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
                Welcome, {user?.name || 'Doctor'}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Hospital Clinical Decision Support System. Select a clinical tool from the sidebar to begin.
              </p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Patient Records',
                  desc: 'Search clinical history and view patient EHR logs.',
                  action: () => setActiveFeature('patients'),
                  icon: <Users className="w-5 h-5 text-teal-600" />,
                  label: 'Open Records',
                },
                {
                  title: 'New Prescription',
                  desc: 'Create prescriptions with real-time active ingredient safety checks.',
                  action: () => setActiveFeature('prescription'),
                  icon: <ClipboardList className="w-5 h-5 text-teal-600" />,
                  label: 'Start Prescribing',
                },
                {
                  title: 'Rx Scanner (OCR)',
                  desc: 'Extract medication lists from scanned prescription images.',
                  action: () => setActiveFeature('ocr'),
                  icon: <ScanLine className="w-5 h-5 text-teal-600" />,
                  label: 'Scan Image',
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

            {/* Info Panel */}
            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 text-sm mb-3">Clinical Decision System Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Interaction Engine</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">Online</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">OCR Scanner</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">Ready</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Knowledge Graph</p>
                  <p className="text-sm font-semibold text-green-700 mt-0.5">Active</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">System Mode</p>
                  <p className="text-sm font-semibold text-amber-700 mt-0.5">Demo Auth</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      case 'patients':
        return (
          <PatientEHR
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            onStartPrescription={() => setActiveFeature('prescription')}
          />
        );
      case 'prescription':
        return (
          <PrescriptionCreator
            selectedPatient={selectedPatient}
            onCheck={handleCheckInteractions}
            isChecking={isCheckingInteractions}
            onSubmit={handleVerifySubmit}
            quotaExceeded={quotaExceeded}
            onDismissPaywall={() => setQuotaExceeded(false)}
            onViewAlternatives={() => setActiveFeature('alternatives')}
          />
        );
      case 'interactions':
        return (
          <PolypharmacyScan
            onScanComplete={setScannedDrugs}
            forceScanning={isCheckingInteractions}
            injectDrugs={ocrDrugs}
          />
        );
      case 'ocr':
        return (
          <OCRScanner
            selectedPatient={selectedPatient}
            onSendToScanner={(meds) => {
              setOcrDrugs(meds);
              setActiveFeature('interactions');
            }}
          />
        );
      case 'alternatives':
        return <SmartAlternatives selectedPatient={selectedPatient} />;
      case 'symptoms':
        return <ReverseSymptomTracer selectedPatient={selectedPatient} />;
      case 'map':
        return <VisualPrescriptionMap scannedDrugs={scannedDrugs} selectedPatient={selectedPatient} />;
      case 'risk':
        return <RiskAnalysis dynamicRisks={risks} selectedPatient={selectedPatient} />;
      case 'ai':
        return <GraphRAGChatbot currentMedications={scannedDrugs} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardShell
        menuItems={menuItems}
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        title="Physician Portal"
      >
        {renderActiveFeature()}
        {scanError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 text-sm text-red-700">
            {scanError}
          </div>
        )}
      </DashboardShell>
      {/* Floating Clinical AI assistant */}
      <GraphRAGChatbot currentMedications={scannedDrugs} floatingMode />
    </>
  );
}
