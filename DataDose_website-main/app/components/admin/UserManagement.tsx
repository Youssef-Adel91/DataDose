'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  verificationDocument: string | null;
  createdAt: string;
}

// ─── Static data for "Active Users" panel ─────────────────────────────────────

const activeUsers = [
  { id: 1, name: 'Dr. Sarah Johnson', role: 'Physician',  status: 'active',   lastLogin: '20 min ago',  department: 'Cardiology'     },
  { id: 2, name: 'Ahmed Pharm',        role: 'Pharmacist', status: 'active',   lastLogin: '5 min ago',   department: 'Pharmacy'       },
  { id: 3, name: 'DataDose Admin',     role: 'Admin',      status: 'active',   lastLogin: '2 hours ago', department: 'Administration' },
];

const roleColors: Record<string, string> = {
  Pharmacist:  'bg-blue-100 text-blue-700',
  Physician:   'bg-teal-100 text-teal-700',
  Admin:       'bg-purple-100 text-purple-700',
  SUPER_ADMIN: 'bg-amber-100 text-amber-700',
  PHYSICIAN:   'bg-teal-100 text-teal-700',
  PHARMACIST:  'bg-blue-100 text-blue-700',
  ADMIN:       'bg-purple-100 text-purple-700',
  PATIENT:     'bg-gray-100 text-gray-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const { data: session } = useSession();
  const callerRole = (session?.user as any)?.role as string | undefined;
  const isSuperAdmin = callerRole === 'SUPER_ADMIN';

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  // ── Fetch pending users ───────────────────────────────────────────────────

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pending-users');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPendingUsers(data.users ?? []);
    } catch {
      setPendingUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── Perform action on a user ──────────────────────────────────────────────

  const handleAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      setFeedback({ id: userId, msg: data.message, type: 'success' });
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setFeedback({ id: userId, msg: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6" id="users">

      {/* ── Pending Approvals Panel ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-strong rounded-xl p-8 border-l-4 border-amber-400"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Approvals</h2>
              <p className="text-sm text-slate-500">Users awaiting institution verification</p>
            </div>
            {pendingUsers.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {pendingUsers.length} PENDING
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPending}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 px-3 py-2 rounded-lg hover:bg-teal-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
            <span className="ml-3 text-slate-500">Loading pending users…</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 className="w-12 h-12 mb-3 text-green-400" />
            <p className="font-semibold text-slate-600">All clear — no pending approvals</p>
            <p className="text-sm mt-1">New registration requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center justify-between p-4 bg-amber-50/60 border border-amber-200 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                        {user.verificationDocument && (
                          <span className="text-xs flex items-center gap-1 text-slate-500">
                            <FileText className="w-3 h-3" />
                            {user.verificationDocument}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {feedback?.id === user.id && (
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.msg}
                      </span>
                    )}

                    {/* SUPER_ADMIN ONLY: Elevate to Admin ── shown conditionally */}
                    {isSuperAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!!actionLoading}
                        onClick={() => handleAction(user.id, 'elevate_to_admin')}
                        title="Elevate to Admin — SUPER_ADMIN only"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        {actionLoading === user.id + 'elevate_to_admin' ? 'Elevating…' : 'Make Admin'}
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!!actionLoading}
                      onClick={() => handleAction(user.id, 'approve')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actionLoading === user.id + 'approve' ? 'Approving…' : 'Approve'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!!actionLoading}
                      onClick={() => handleAction(user.id, 'reject')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {actionLoading === user.id + 'reject' ? 'Rejecting…' : 'Reject'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Active Users Table ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card-strong rounded-xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active Users</h2>
              <p className="text-sm text-slate-500">Approved platform users</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-teal text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add User
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Login</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                  className="border-b border-slate-200 hover:bg-teal-50/30 transition"
                >
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">{user.department}</td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">{user.lastLogin}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600">
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 hover:bg-red-50 rounded-lg transition text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
