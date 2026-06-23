'use client';

import React from 'react';
import { Bell, Lock, User } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <div id="profile" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Name</label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Role</label>
            <input
              type="text"
              value={user.role.replace('_', ' ')}
              disabled
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 capitalize"
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div id="security" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">Security</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Password changes must be requested through hospital IT administration.
        </p>

        <button
          disabled
          className="w-full bg-slate-100 text-slate-500 font-medium py-2.5 rounded-lg text-sm cursor-not-allowed"
        >
          Request Password Change
        </button>
      </div>

      {/* Notifications Section */}
      <div id="notifications" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Drug Interaction Warnings', desc: 'Critical interaction alerts' },
            { label: 'Prescription Updates', desc: 'Status changes for prescriptions' },
            { label: 'System Maintenance', desc: 'Planned downtime notifications' },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
