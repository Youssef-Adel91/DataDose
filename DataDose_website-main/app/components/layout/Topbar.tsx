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
  /** Array of notification items — badge count is derived from this length. */
  notifications?: { id: string; title: string; body: string; read: boolean }[];
}

export default function Topbar({
  userName,
  userRole,
  activeFeatureLabel,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
  notifications = [],
}: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-4.5 h-4.5 text-slate-500" />
              {/* Unread count badge — lights up when Kafka FDA alerts arrive in Sprint 2 */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No new notifications</p>
                      <p className="text-[10px] text-slate-300 mt-1">FDA alerts will appear here in real-time</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-slate-50 last:border-0 text-left ${
                          !n.read ? 'bg-teal-50/60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0 mt-1" />}
                          <div className={!n.read ? '' : 'ml-4'}>
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
