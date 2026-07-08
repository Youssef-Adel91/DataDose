'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  FileText,
  AlertTriangle,
  Lightbulb,
  Pill,
  Settings as SettingsIcon,
  CheckCircle,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import DashboardShell from '@/app/components/layout/DashboardShell';
import Settings from '@/app/components/layout/Settings';
import MyHealthProfile from '@/app/components/patient/MyHealthProfile';
import AIPatientInsights from '@/app/components/patient/AIPatientInsights';
import { containerVariants, itemVariants } from '@/app/components/shared/animations';
import { useAuth } from '@/app/context/AuthContext';

const menuItems = [
  { id: 'profile', label: 'My Health Profile', icon: <Heart className="w-5 h-5" /> },
  { id: 'prescriptions', label: 'My Prescriptions', icon: <FileText className="w-5 h-5" /> },
  { id: 'medicines', label: 'My Medicines', icon: <Pill className="w-5 h-5" /> },
  { id: 'insights', label: 'AI Insights', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 'alerts', label: 'Safety Alerts', icon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
];

const prescriptionsMock = [
  { id: 'RX-94028', date: '2026-06-18', doctor: 'Dr. Alex Care', meds: 'Lisinopril 10mg (1x daily), Metformin 500mg (2x daily)', status: 'Active' },
  { id: 'RX-73918', date: '2026-05-10', doctor: 'Dr. Alex Care', meds: 'Amoxicillin 500mg (3x daily - 7 days)', status: 'Completed' },
];

const medicinesMock = [
  { name: 'Lisinopril 10mg', time: 'Morning (08:00 AM)', purpose: 'Blood Pressure', instructions: 'Take with or without food. Avoid potassium supplements.' },
  { name: 'Metformin 500mg', time: 'Morning (08:00 AM) & Evening (08:00 PM)', purpose: 'Type 2 Diabetes', instructions: 'Take with meals to reduce stomach side effects.' },
];

export default function PatientDashboard() {
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
                Welcome, {user?.name || 'Patient'}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Personal Medication Safety & Health Portal. Access your clinical reports below.
              </p>
            </motion.div>

            {/* Active Alerts Banner */}
            <motion.div variants={itemVariants}>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">Medication Safety Notice</h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This portal details your active therapies and provides AI insights. Do not alter dosages or start new therapies without discussing them with your primary care provider.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'My Health Profile',
                  desc: 'View active conditions, documented allergies, and primary physician.',
                  action: () => setActiveFeature('profile'),
                  icon: <Heart className="w-5 h-5 text-teal-600" />,
                  label: 'View Profile',
                },
                {
                  title: 'My Prescriptions',
                  desc: 'List current active pharmacy orders and historical transcripts.',
                  action: () => setActiveFeature('prescriptions'),
                  icon: <FileText className="w-5 h-5 text-teal-600" />,
                  label: 'View Orders',
                },
                {
                  title: 'Medication Schedule',
                  desc: 'Track daily pill schedule times and safety guidelines.',
                  action: () => setActiveFeature('medicines'),
                  icon: <Pill className="w-5 h-5 text-teal-600" />,
                  label: 'View Schedule',
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
      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="lg:col-span-1">
              <MyHealthProfile />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Documented Allergies</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Penicillin Allergy</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Severity: High. Severe rash and breathing difficulty documented in EHR logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'prescriptions':
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Prescription History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold">
                    <th className="py-2.5">Rx ID</th>
                    <th className="py-2.5">Issue Date</th>
                    <th className="py-2.5">Prescribed By</th>
                    <th className="py-2.5">Medications</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {prescriptionsMock.map((rx) => (
                    <tr key={rx.id}>
                      <td className="py-3 font-semibold text-slate-900">{rx.id}</td>
                      <td className="py-3 text-slate-600">{rx.date}</td>
                      <td className="py-3 text-slate-600">{rx.doctor}</td>
                      <td className="py-3 text-slate-600">{rx.meds}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rx.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {rx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'medicines':
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              Medication Intake Schedule
            </h2>
            <p className="text-xs text-slate-500 mb-6">Daily clock-based calendar to track intake times and directives.</p>
            
            <div className="space-y-6 relative border-l border-slate-200 pl-6 ml-3">
              {/* Morning Slot */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-teal-650 border-2 border-white flex items-center justify-center text-[8px] text-white">🌅</div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Morning Administration</h3>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded text-[10px]">08:00 AM</span>
                </div>
                <div className="space-y-3">
                  <div className="border border-slate-150 bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Lisinopril 10mg</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Indication: Essential Hypertension</p>
                      <p className="text-[11px] text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-100">
                        <strong>Guidelines:</strong> Take with or without food. Avoid potassium supplements.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full self-start md:self-center">1 Pill daily</span>
                  </div>

                  <div className="border border-slate-150 bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Metformin 500mg</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Indication: Type 2 Diabetes</p>
                      <p className="text-[11px] text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-100">
                        <strong>Guidelines:</strong> Take with breakfast to reduce gastrointestinal irritation.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full self-start md:self-center">1 Pill (Dose 1/2)</span>
                  </div>
                </div>
              </div>

              {/* Evening Slot */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-750 border-2 border-white flex items-center justify-center text-[8px] text-white">🌃</div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Evening Administration</h3>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">08:00 PM</span>
                </div>
                <div className="space-y-3">
                  <div className="border border-slate-150 bg-slate-50/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Metformin 500mg</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Indication: Type 2 Diabetes</p>
                      <p className="text-[11px] text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-100">
                        <strong>Guidelines:</strong> Take with dinner to ensure consistent plasma levels.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full self-start md:self-center">1 Pill (Dose 2/2)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'insights':
        return <AIPatientInsights />;
      case 'alerts':
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Safety Log & Alerts</h2>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Critical Allergy Warning</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Ensure any medical staff is aware of your Penicillin allergy. Beta-lactam antibiotic variants pose severe cross-reactivity risks.
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Active Therapy Monitoring</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your blood pressure (Lisinopril) is monitored quarterly. Schedule your next telehealth check-in before 2026-09-15.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
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
      title="Patient Portal"
    >
      {renderActiveFeature()}
    </DashboardShell>
  );
}
