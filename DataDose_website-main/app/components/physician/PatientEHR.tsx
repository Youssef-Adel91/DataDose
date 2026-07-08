'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Calendar, FileText, Heart, AlertTriangle, User, ShieldAlert, History, Plus } from 'lucide-react';

export const patients = [
  {
    id: 1,
    name: 'Michael Chen',
    email: 'michael@datadose.ai',
    age: 67,
    gender: 'Male',
    condition: 'Type 2 Diabetes, CKD Stage 3',
    allergies: 'None documented',
    chronicDiseases: 'Type 2 Diabetes, Stage 3 Chronic Kidney Disease',
    currentMeds: [
      { name: 'Metformin', dose: '500mg', freq: '2x daily', since: '2024-11-12' },
      { name: 'Atorvastatin', dose: '20mg', freq: '1x daily', since: '2025-01-15' }
    ],
    prevPrescriptions: [
      { name: 'Glipizide 5mg', doctor: 'Dr. Alex Care', date: '2024-05-10', duration: '3 months' }
    ],
    stoppedMeds: [
      { name: 'Glipizide 5mg', date: '2024-08-10', reason: 'HbA1c targets met, transitioned to Metformin monotherapy.' }
    ],
    timeline: [
      { date: '2025-01-15', event: 'Started Atorvastatin 20mg daily for hypercholesterolemia management.' },
      { date: '2024-11-12', event: 'Diagnosed with Type 2 Diabetes. Started Metformin 500mg 2x daily.' },
      { date: '2024-08-10', event: 'Discontinued Glipizide 5mg daily.' }
    ],
    doctorNotes: 'Monitor renal clearance regularly. Patient eGFR was 42 mL/min/1.73m² at last check (CKD Stage 3). Do not increase Metformin dosage without repeating serum creatinine.',
    visitHistory: [
      { date: '2026-03-10', type: 'Routine Follow-up', doctor: 'Dr. Alex Care', status: 'Stable' },
      { date: '2025-11-12', type: 'Annual Wellness Exam', doctor: 'Dr. Alex Care', status: 'Stable' }
    ],
    warnings: 'High risk of lactic acidosis if Metformin is given during acute kidney injury or with iodinated contrast dye.',
    status: 'stable',
  },
  {
    id: 2,
    name: 'Sara Patient',
    email: 'sara@datadose.ai',
    age: 34,
    gender: 'Female',
    condition: 'Asthma, Penicillin Allergy',
    allergies: 'Penicillin (Severe rash, dyspnea documented)',
    chronicDiseases: 'Mild Persistent Asthma',
    currentMeds: [
      { name: 'Albuterol Inhaler', dose: '90mcg', freq: 'As needed', since: '2023-04-10' },
      { name: 'Fluticasone Propionate', dose: '110mcg', freq: '2x daily', since: '2025-02-18' }
    ],
    prevPrescriptions: [
      { name: 'Montelukast 10mg', doctor: 'Dr. Alex Care', date: '2024-01-15', duration: '6 months' }
    ],
    stoppedMeds: [
      { name: 'Amoxicillin 500mg', date: '2024-07-22', reason: 'Experienced allergic reaction (rash/wheezing). Documented in EHR.' }
    ],
    timeline: [
      { date: '2025-02-18', event: 'Started Fluticasone Propionate daily inhaler for controller therapy.' },
      { date: '2024-07-22', event: 'Penicillin allergy documented after acute reaction to Amoxicillin.' }
    ],
    doctorNotes: 'Asthma symptoms well controlled on inhaled corticosteroids. Strictly avoid all beta-lactam class antibiotics due to severe allergy profile.',
    visitHistory: [
      { date: '2026-04-09', type: 'Asthma Follow-up', doctor: 'Dr. Alex Care', status: 'Controlled' },
      { date: '2025-07-22', type: 'Urgent Care - Allergic Reaction', doctor: 'Dr. Sarah Smith', status: 'Resolved' }
    ],
    warnings: 'DOCUMENTED PENICILLIN ANAPHYLAXIS RISK. Do not prescribe Amoxicillin, Ampicillin, or Piperacillin.',
    status: 'monitoring',
  },
  {
    id: 3,
    name: 'Sarah Johnson',
    email: 'sarah@datadose.ai',
    age: 42,
    gender: 'Female',
    condition: 'Hypertension',
    allergies: 'None documented',
    chronicDiseases: 'Essential Hypertension',
    currentMeds: [
      { name: 'Lisinopril', dose: '10mg', freq: '1x daily', since: '2025-05-20' }
    ],
    prevPrescriptions: [
      { name: 'Amlodipine 5mg', doctor: 'Dr. Alex Care', date: '2024-09-02', duration: '2 months' }
    ],
    stoppedMeds: [
      { name: 'Amlodipine 5mg', date: '2024-11-02', reason: 'Patient developed mild peripheral edema.' }
    ],
    timeline: [
      { date: '2025-05-20', event: 'Started Lisinopril 10mg daily. Good therapeutic response.' },
      { date: '2024-09-02', event: 'Started Amlodipine 5mg. Discontinued due to ankle swelling.' }
    ],
    doctorNotes: 'Blood pressure is controlled at 122/78 on Lisinopril 10mg daily. Monitor serum potassium and creatinine annually.',
    visitHistory: [
      { date: '2026-03-12', type: 'BP Checkup', doctor: 'Dr. Alex Care', status: 'Stable' }
    ],
    warnings: 'Do not prescribe potassium-sparing diuretics concurrently without monitoring potassium levels.',
    status: 'stable',
  },
  {
    id: 4,
    name: 'George Williams',
    email: 'george@datadose.ai',
    age: 58,
    gender: 'Male',
    condition: 'COPD, Hypertension',
    allergies: 'Sulfa Drugs (Mild hives)',
    chronicDiseases: 'COPD, Stage 1 Hypertension',
    currentMeds: [
      { name: 'Tiotropium Bromide', dose: '18mcg', freq: '1x daily', since: '2024-08-01' },
      { name: 'Losartan', dose: '50mg', freq: '1x daily', since: '2025-03-10' }
    ],
    prevPrescriptions: [
      { name: 'Atenolol 25mg', doctor: 'Dr. Alex Care', date: '2024-02-12', duration: '6 months' }
    ],
    stoppedMeds: [
      { name: 'Atenolol 25mg', date: '2024-08-12', reason: 'Beta-blocker exacerbated COPD bronchospasm symptoms.' }
    ],
    timeline: [
      { date: '2025-03-10', event: 'Started Losartan 50mg daily for hypertension.' },
      { date: '2024-08-01', event: 'Started Tiotropium Bromide inhaler. Atenolol discontinued.' }
    ],
    doctorNotes: 'Strictly avoid beta-blockers (such as Atenolol, Metoprolol) as they trigger acute COPD flare-ups. Use ARBs for hypertension management.',
    visitHistory: [
      { date: '2026-03-08', type: 'Pulmonology Review', doctor: 'Dr. Alex Care', status: 'Stable' }
    ],
    warnings: 'COPD - Contraindicated for non-selective beta-blockers. Sulfa drug allergy alert.',
    status: 'follow-up',
  },
];

export default function PatientEHR({
  selectedPatient,
  onSelectPatient,
  onStartPrescription,
}: {
  selectedPatient: any;
  onSelectPatient: (patient: typeof patients[number]) => void;
  onStartPrescription: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'meds' | 'notes'>('overview');

  const activePatient = selectedPatient || patients[0];

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8 animate-fadeIn"
      id="patients"
    >
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Records (EHR)</h2>
          <p className="text-xs text-slate-500 mt-1">Access clinical charts and drug safety profiles</p>
        </div>
        <Users className="w-6 h-6 text-teal-600 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Search & List */}
        <div className="space-y-2 lg:border-r lg:border-slate-200 lg:pr-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => {
                  onSelectPatient(patient);
                  setActiveTab('overview');
                }}
                className={`p-3 rounded-lg cursor-pointer transition text-left border ${
                  activePatient.id === patient.id
                    ? 'bg-teal-50/70 border-teal-300 text-teal-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-sm">{patient.name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    patient.status === 'stable' ? 'bg-green-100 text-green-800' :
                    patient.status === 'monitoring' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {patient.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{patient.condition}</p>
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No matching patients found</p>
            )}
          </div>
        </div>

        {/* Right Columns: Patient Details & Sub-Tabs */}
        <div className="lg:col-span-2 flex flex-col justify-between min-h-[460px]">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-bold text-base">
                  {activePatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{activePatient.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activePatient.age} Y/O · {activePatient.gender} · ID: Patient-{activePatient.id}
                  </p>
                </div>
              </div>
              <button
                onClick={onStartPrescription}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Start Prescription
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 mb-4 gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'meds', label: 'Medications', icon: <Heart className="w-3.5 h-3.5" /> },
                { id: 'notes', label: 'Clinical Notes', icon: <FileText className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-teal-700 text-teal-800 bg-teal-50/30'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Panels */}
            <div className="min-h-[250px]">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="space-y-4 text-left"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chronic Conditions</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{activePatient.chronicDiseases}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Allergies</p>
                        <p className={`text-sm font-semibold mt-1 ${
                          activePatient.allergies.toLowerCase().includes('none')
                            ? 'text-slate-800'
                            : 'text-red-600 flex items-center gap-1'
                        }`}>
                          {!activePatient.allergies.toLowerCase().includes('none') && <AlertTriangle className="w-4 h-4" />}
                          {activePatient.allergies}
                        </p>
                      </div>
                    </div>

                    {activePatient.warnings && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">Critical Clinical Warning</p>
                          <p className="text-xs text-amber-700 mt-1">{activePatient.warnings}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'meds' && (
                  <motion.div
                    key="meds"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="space-y-4 text-left"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active medications */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Active Medications</p>
                        <div className="space-y-2">
                          {activePatient.currentMeds.map((med: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <p className="text-xs font-semibold text-slate-850">{med.name} {med.dose}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Frequency: {med.freq}</p>
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium">Since: {med.since}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Discontinued / stopped medications */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Discontinued Medications</p>
                        <div className="space-y-2">
                          {activePatient.stoppedMeds.map((med: any, i: number) => (
                            <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-semibold text-red-800 line-through">{med.name}</p>
                                <span className="text-[9px] text-slate-400">Date: {med.date}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 italic"><strong>Reason:</strong> {med.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Medication History Timeline
                      </p>
                      <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                        {activePatient.timeline.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 border-2 border-white" />
                            <span className="text-[10px] text-slate-400 font-semibold">{item.date}</span>
                            <p className="text-xs text-slate-700 mt-0.5">{item.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="space-y-4 text-left"
                  >
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Doctor Clinical Notes</p>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-150 leading-relaxed font-serif italic">
                        "{activePatient.doctorNotes}"
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Recent Visit Log</p>
                      <div className="divide-y divide-slate-100 text-xs">
                        {activePatient.visitHistory.map((visit: any, i: number) => (
                          <div key={i} className="flex justify-between py-2 flex-wrap gap-2">
                            <div>
                              <span className="font-semibold text-slate-800">{visit.type}</span>
                              <span className="text-slate-400 ml-1.5">by {visit.doctor}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500">{visit.date}</span>
                              <span className="font-bold text-green-700">{visit.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-slate-150 pt-4 flex justify-between items-center text-xs text-slate-400">
            <span>Primary Care Physician: Dr. Alex Care</span>
            <span>Last Sync: Just now</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
