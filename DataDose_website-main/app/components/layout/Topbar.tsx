'use client';

import React, { useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  userName: string;
  userRole: string;
  activeFeatureLabel: string;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Topbar({
  userName,
  userRole,
  activeFeatureLabel,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
}: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 h-14 w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
        {/* Left Area: Logo and Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
          )}

          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/logo.svg" className="h-8 w-auto object-contain" alt="DataDose Logo" />
            <div>
              <div className="flex items-center gap-1.5">
                {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && (
                  <span className="px-1.5 py-0.5 text-[8px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200 uppercase tracking-wider">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-none">{activeFeatureLabel}</p>
            </div>
          </Link>
        </div>

        {/* Right Area: Actions & Info */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition relative"
            >
              <Bell className="w-4.5 h-4.5 text-slate-500" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg p-3 shadow-lg z-50">
                <h3 className="font-semibold text-slate-900 text-sm mb-2">Notifications</h3>
                <p className="text-xs text-slate-400 py-4 text-center">No new notifications</p>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-400 capitalize leading-tight">
                {userRole.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0)}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
