'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, ArrowRight, CornerDownLeft, RefreshCw, Send, Check } from 'lucide-react';

interface PrescriptionOrder {
  id: string;
  patientName: string;
  doctorName: string;
  medications: string;
  riskStatus: 'critical' | 'warning' | 'safe';
  riskDetail: string;
  date: string;
  status: 'pending' | 'approved' | 'flagged';
  notes?: string;
}

export default function DrugAlerts() {
  const [orders, setOrders] = useState<PrescriptionOrder[]>([
    {
      id: 'Rx-2094',
      patientName: 'Sara Patient',
      doctorName: 'Dr. Alex Care',
      medications: 'Amoxicillin 500mg, Albuterol 90mcg',
      riskStatus: 'critical',
      riskDetail: 'Critical: Penicillin Allergy Contraindication',
      date: '2026-06-21',
      status: 'pending',
    },
    {
      id: 'Rx-1845',
      patientName: 'Michael Chen',
      doctorName: 'Dr. Sarah Smith',
      medications: 'Metformin 500mg, Atorvastatin 20mg',
      riskStatus: 'warning',
      riskDetail: 'Warning: stage 3 CKD Metformin clearance risk',
      date: '2026-06-21',
      status: 'pending',
    },
    {
      id: 'Rx-1042',
      patientName: 'Sarah Johnson',
      doctorName: 'Dr. Alex Care',
      medications: 'Lisinopril 10mg, Aspirin 81mg',
      riskStatus: 'warning',
      riskDetail: 'Warning: Lisinopril-Aspirin co-administration DDI',
      date: '2026-06-21',
      status: 'pending',
    },
    {
      id: 'Rx-0941',
      patientName: 'George Williams',
      doctorName: 'Dr. Sarah Smith',
      medications: 'Losartan 50mg, Tiotropium 18mcg',
      riskStatus: 'safe',
      riskDetail: 'Formulary compliant order',
      date: '2026-06-20',
      status: 'approved',
    },
  ]);

  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleApprove = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'approved' } : o));
    setSuccessMessage(`Order ${id} has been verified and marked as Ready to Dispense.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleFlagSubmit = (id: string) => {
    if (!flagNote.trim()) return;
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'flagged', notes: flagNote } : o));
    setActiveFlagId(null);
    setFlagNote('');
    setSuccessMessage(`Order ${id} flagged and returned to prescribing physician.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8 animate-fadeIn"
      id="alerts"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Prescription Verification Queue</h2>
          <p className="text-xs text-slate-500 mt-1">Review incoming hospital medication orders and clinical risk logs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {orders.filter(o => o.status === 'pending').length} Pending Review
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-bold animate-fadeIn flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* Verification Queue */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase text-[9px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Prescriber</th>
              <th className="px-4 py-3">Medications</th>
              <th className="px-4 py-3">Safety Risk Assessment</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-700">
            {orders.map((order) => (
              <tr key={order.id} className={`hover:bg-slate-50/50 ${order.status === 'approved' ? 'bg-green-50/10' : (order.status === 'flagged' ? 'bg-red-50/10' : '')}`}>
                <td className="px-4 py-4 font-bold text-slate-900">{order.id}</td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-800">{order.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Date: {order.date}</div>
                </td>
                <td className="px-4 py-4 font-medium text-slate-550">{order.doctorName}</td>
                <td className="px-4 py-4 font-medium text-slate-800 max-w-[180px] truncate" title={order.medications}>
                  {order.medications}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    order.riskStatus === 'critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                    order.riskStatus === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {order.riskStatus === 'critical' ? '🔴' : (order.riskStatus === 'warning' ? '🟡' : '✅')}
                    {order.riskDetail}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    order.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                    order.status === 'flagged' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-slate-100 text-slate-600 border-slate-200 animate-pulse'
                  }`}>
                    {order.status}
                  </span>
                  {order.status === 'flagged' && order.notes && (
                    <p className="text-[10px] text-red-750 font-serif italic mt-1.5">"{order.notes}"</p>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  {order.status === 'pending' && (
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-1 px-2.5 rounded text-[11px] transition cursor-pointer"
                      >
                        Approve & Dispense
                      </button>
                      <button
                        onClick={() => setActiveFlagId(order.id)}
                        className="border border-red-300 text-red-700 hover:bg-red-50 font-semibold py-1 px-2.5 rounded text-[11px] transition cursor-pointer"
                      >
                        Flag Review
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flag review modal overlay */}
      <AnimatePresence>
        {activeFlagId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border rounded-xl shadow-2xl p-6 w-full max-w-md text-left"
            >
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                <CornerDownLeft className="w-4 h-4 text-red-650" />
                Flag Prescription {activeFlagId} for Review
              </h3>
              <p className="text-xs text-slate-500 mb-4">This sends the order back to the prescriber with an audit notification.</p>
              
              <textarea
                placeholder="Enter pharmacist note (e.g. Critical allergy conflict, alternative selection required...)"
                value={flagNote}
                onChange={e => setFlagNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-400 mb-4"
                rows={3}
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setActiveFlagId(null);
                    setFlagNote('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-350 hover:bg-slate-50 text-xs text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFlagSubmit(activeFlagId)}
                  disabled={!flagNote.trim()}
                  className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  Flag Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
