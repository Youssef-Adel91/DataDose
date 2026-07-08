'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, ClipboardList, Clock, Search, Filter, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  level: 'critical' | 'warning' | 'info' | 'success';
}

export default function SafetyMonitoring() {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [logs] = useState<AuditLog[]>([
    {
      id: 1,
      timestamp: '2026-06-21 17:42:15',
      actor: 'Dr. Alex Care',
      action: 'Medical Safety Override',
      details: 'Patient: Sara Patient. Rx: Amoxicillin. Reason: Alternatives exhausted. Benefits outweigh allergy rash risk under close clinical observation.',
      level: 'critical',
    },
    {
      id: 2,
      timestamp: '2026-06-21 17:35:10',
      actor: 'Pharmacist John Doe',
      action: 'Dispensing Approved',
      details: 'Rx-0941 approved for patient George Williams (Losartan 50mg, Tiotropium 18mcg). No DDI flagged.',
      level: 'success',
    },
    {
      id: 3,
      timestamp: '2026-06-21 17:15:00',
      actor: 'Dr. Sarah Smith',
      action: 'Safety Warning Ignored',
      details: 'Metformin Stage 3 CKD warning shown for Michael Chen. Proceeded with lower dosage limit (500mg daily).',
      level: 'warning',
    },
    {
      id: 4,
      timestamp: '2026-06-21 16:50:22',
      actor: 'System Admin',
      action: 'Auth Session Reset',
      details: 'Demo Authentication database bypass activated. Workstation session authorized.',
      level: 'info',
    },
    {
      id: 5,
      timestamp: '2026-06-21 15:30:11',
      actor: 'Pharmacist John Doe',
      action: 'Prescription Flagged',
      details: 'Rx-2094 flagged for review. Note: Penicillin allergy contraindication found in Sara Patient EHR.',
      level: 'critical',
    },
  ]);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const levelBadges = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8 animate-fadeIn"
      id="safety"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">IT & Compliance Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time tracker of clinician overrides, dispensing approvals, and security alerts</p>
        </div>
        <ClipboardList className="w-6 h-6 text-teal-700" />
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 text-left">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by clinician name, action, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 transition text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-450 shrink-0" />
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-slate-800"
          >
            <option value="all">All Audit Levels</option>
            <option value="critical">Critical Overrides</option>
            <option value="warning">Warnings</option>
            <option value="success">Approvals</option>
            <option value="info">System Info</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-550 uppercase text-[9px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Clinician / Actor</th>
              <th className="px-4 py-3">Audit Action</th>
              <th className="px-4 py-3">Event Details</th>
              <th className="px-4 py-3 text-center">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-4 font-medium text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timestamp}
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-slate-800 whitespace-nowrap">{log.actor}</td>
                <td className="px-4 py-4 font-semibold text-teal-800 whitespace-nowrap">{log.action}</td>
                <td className="px-4 py-4 text-slate-650 max-w-sm font-medium leading-relaxed">{log.details}</td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${levelBadges[log.level]}`}>
                    {log.level}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 font-medium bg-slate-50">
                  No compliance audit logs found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Compliance Notice */}
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-left text-xs text-slate-650">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
        <p>
          Audit logs are read-only and secured with SHA-256 integrity checks. All pharmaceutical overrides are permanently recorded in the EHR compliance ledger for Joint Commission reviews.
        </p>
      </div>
    </motion.div>
  );
}
