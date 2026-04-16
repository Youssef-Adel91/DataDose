'use client';

import { motion } from 'framer-motion';
import { Settings, Bell, Lock, User } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account preferences</p>
        </motion.div>

        <div className="mt-8 space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-strong rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <input
                  type="text"
                  value={user.role.replace('_', ' ').toUpperCase()}
                  disabled
                  className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-slate-900"
                />
              </div>
            </div>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-strong rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Security</h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-teal text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
              onClick={() => alert('Change password functionality coming soon!')}
            >
              Change Password
            </motion.button>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-strong rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Email Alerts', desc: 'Receive alerts via email' },
                { label: 'Drug Interaction Warnings', desc: 'Get notified of critical interactions' },
                { label: 'System Updates', desc: 'Notification about system maintenance' },
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
