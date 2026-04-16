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
  Microscope,
  Bot,
  ScanLine,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import PatientEHR from '@/app/components/physician/PatientEHR';
import PrescriptionCreator from '@/app/components/physician/PrescriptionCreator';
import RiskAnalysis from '@/app/components/physician/RiskAnalysis';
import PolypharmacyScan from '@/app/components/PolypharmacyScan';
import SmartAlternatives from '@/app/components/SmartAlternatives';
import VisualPrescriptionMap from '@/app/components/VisualPrescriptionMap';
import ReverseSymptomTracer from '@/app/components/ReverseSymptomTracer';
import GraphRAGChatbot from '@/app/components/GraphRAGChatbot';
import OCRScanner from '@/app/components/OCRScanner';

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
    label: 'AI Rx Scanner',
    icon: <ScanLine className="w-5 h-5" />,
    href: '#ocr-scanner',
  },
  {
    label: 'Smart Alternatives',
    icon: <RefreshCw className="w-5 h-5" />,
    href: '#smart-alternatives',
  },
  {
    label: 'Symptom Tracer',
    icon: <Microscope className="w-5 h-5" />,
    href: '#symptom-tracer',
  },
  {
    label: 'Visual Map',
    icon: <GitBranch className="w-5 h-5" />,
    href: '#visual-map',
  },
  {
    label: 'AI Assistant',
    icon: <Bot className="w-5 h-5" />,
    href: '#graphrag-chatbot',
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
  const [quotaTrackedUserEmail] = useState(() => {
    if (typeof window === 'undefined') return `qa-physician+${Date.now()}@datadose.ai`;
    const existing = sessionStorage.getItem('qaQuotaEmail');
    if (existing) return existing;
    const generated = `qa-physician+${Date.now()}@datadose.ai`;
    sessionStorage.setItem('qaQuotaEmail', generated);
    return generated;
  });
  const [scannedDrugs, setScannedDrugs] = useState<string[]>([]);
  const [ocrDrugs, setOcrDrugs] = useState<string[]>([]);
  const [risks, setRisks] = useState<any[] | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [scanError, setScanError] = useState('');

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
          userEmail: quotaTrackedUserEmail,
          conditions: selectedPatient?.condition
            ? String(selectedPatient.condition).split(',').map((c: string) => c.trim())
            : [],
        }),
      });
      const result = await response.json();
      if (response.status === 403 && result?.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        setRisks([]);
        return { ok: false, message: result?.message || 'Quota exceeded.' };
      }
      if (response.status === 503 && result?.error === 'AI_GRAPH_ENGINE_OFFLINE') {
        setRisks([]);
        setScanError(result?.message || 'AI Graph Engine is offline. Please start the Python backend.');
        return { ok: false, message: result?.message || 'AI Graph Engine is offline. Please start the Python backend.' };
      }
      if (!response.ok) {
        setRisks([]);
        setScanError(result?.message || 'AI scan failed.');
        return { ok: false, message: result?.message || 'AI scan failed.' };
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
    } catch (e) {
      setRisks([]);
      return { ok: false, message: 'AI check failed. Please retry.' };
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
          userEmail: quotaTrackedUserEmail,
          patientEmail: selectedPatient?.email,
          medications: drugs,
        }),
      });
      const result = await response.json();
      if (response.status === 403 && result?.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        return { ok: false, quotaExceeded: true, message: result.message || '403 Forbidden: QUOTA_EXCEEDED' };
      }
      if (!response.ok) {
        return { ok: false, message: result?.message || 'Unable to submit prescription.' };
      }
      return { ok: true, message: result?.message || 'Prescription submitted successfully.' };
    } catch {
      return { ok: false, message: 'Unable to submit prescription.' };
    }
  };

  const generateClinicalReport = () => {
    const patientName = selectedPatient?.name || 'Selected patient';
    const riskLevel = risks && risks.length > 0 ? 'High-risk interaction profile detected.' : 'No high-risk interactions detected.';
    setReportSummary(`${patientName}: ${riskLevel} AI review completed with physician-ready treatment notes.`);
  };

  return (
    <>
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
          <PatientEHR onSelectPatient={setSelectedPatient} />
          <PrescriptionCreator
            onCheck={handleCheckInteractions}
            isChecking={isCheckingInteractions}
            onSubmit={handleVerifySubmit}
            quotaExceeded={quotaExceeded}
            onDismissPaywall={() => setQuotaExceeded(false)}
          />
          <OCRScanner onSendToScanner={setOcrDrugs} />
          <PolypharmacyScan
            onScanComplete={setScannedDrugs}
            forceScanning={isCheckingInteractions}
            injectDrugs={ocrDrugs}
          />
          <SmartAlternatives />
          <ReverseSymptomTracer />
          <VisualPrescriptionMap scannedDrugs={scannedDrugs} />
          <GraphRAGChatbot currentMedications={scannedDrugs} />
          <RiskAnalysis dynamicRisks={risks} />
          {scanError && (
            <div className="glass-card-strong rounded-xl p-4 border border-red-300 bg-red-50 text-red-800">
              {scanError}
            </div>
          )}
          <motion.div variants={itemVariants} className="glass-card-strong rounded-xl p-8" id="reports">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Clinical Reports</h2>
              <BarChart3 className="w-6 h-6 text-teal-600" />
            </div>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateClinicalReport}
                className="bg-gradient-teal text-white font-semibold py-3 px-5 rounded-lg hover:shadow-lg transition"
              >
                Generate Clinical Summary
              </motion.button>
              {reportSummary && (
                <div className="bg-white/60 border border-slate-200 rounded-lg p-4">
                  <p className="font-semibold text-slate-900 mb-2">Generated Summary</p>
                  <p className="text-sm text-slate-700">{reportSummary}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      </DashboardLayout>
      {/* Floating GraphRAG widget — always visible while scrolling */}
      <GraphRAGChatbot currentMedications={scannedDrugs} floatingMode />
    </>
  );
}
