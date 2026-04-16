'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Calendar, FileText } from 'lucide-react';

const patients = [
  {
    id: 1,
    name: 'Michael Chen',
    email: 'michael@datadose.ai',
    age: 67,
    condition: 'Type 2 Diabetes',
    lastVisit: '2025-03-10',
    status: 'stable',
  },
  {
    id: 2,
    name: 'Sara Patient',
    email: 'sara@datadose.ai',
    age: 34,
    condition: 'CKD Stage 3, Penicillin Allergy',
    lastVisit: '2025-04-09',
    status: 'monitoring',
  },
  {
    id: 3,
    name: 'Sarah Johnson',
    email: 'sarah@datadose.ai',
    age: 42,
    condition: 'Hypertension',
    lastVisit: '2025-03-12',
    status: 'stable',
  },
  {
    id: 4,
    name: 'George Williams',
    email: 'george@datadose.ai',
    age: 58,
    condition: 'COPD',
    lastVisit: '2025-03-08',
    status: 'follow-up',
  },
];

export default function PatientEHR({
  onSelectPatient,
}: {
  onSelectPatient?: (patient: (typeof patients)[number]) => void;
}) {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);

  useEffect(() => {
    if (onSelectPatient) onSelectPatient(selectedPatient);
  }, [onSelectPatient, selectedPatient]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
      id="patients"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Patient Records (EHR)</h2>
        <Users className="w-6 h-6 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="space-y-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full bg-white/50 border border-teal-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {patients.map((patient) => (
              <motion.div
                key={patient.id}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setSelectedPatient(patient);
                  if (onSelectPatient) onSelectPatient(patient);
                }}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedPatient.id === patient.id
                    ? 'bg-gradient-teal-light border border-teal-300'
                    : 'bg-white/50 hover:bg-white border border-slate-200'
                }`}
              >
                <p className="font-semibold text-slate-900">{patient.name}</p>
                <p className="text-xs text-slate-600 mt-1">{patient.condition}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPatient && (
            <>
              <div className="bg-white/50 rounded-lg p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Patient Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Name</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Age</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.age}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Condition</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPatient.condition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Status</p>
                    <p className="text-sm font-semibold text-teal-600 capitalize">
                      {selectedPatient.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 rounded-lg p-6 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Recent Activity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Last Visit:</span>
                    <span className="font-semibold text-slate-900">{selectedPatient.lastVisit}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Prescriptions:</span>
                    <span className="font-semibold text-slate-900">4 active</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
