'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  Home,
  Settings,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { useFdaAlerts } from '@/app/hooks/useFdaAlerts';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: Array<{
    label: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
  }>;
  title: string;
}

export default function DashboardLayout({
  children,
  sidebarItems,
  title,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Mount the Kafka SSE FDA Alerts stream
  const { alerts, connected, unreadCount, markAllRead } = useFdaAlerts({
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>

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
                <p className="text-[10px] text-slate-400 leading-none">{title}</p>
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen && unreadCount > 0) markAllRead();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition relative"
              >
                <Bell className="w-4.5 h-4.5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      FDA Safety Alerts
                      {connected && <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" title="Live SSE Connected" />}
                    </h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-teal-600 font-medium hover:text-teal-700">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No active alerts</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {alerts.map((alert) => (
                          <li key={alert.id} className={`p-3 hover:bg-slate-50 transition ${!alert.read ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex items-start gap-2.5">
                              <span className="text-sm mt-0.5">
                                {alert.severity === 'critical' ? '🚨' : alert.severity === 'major' ? '⚠️' : '💊'}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">{alert.drug}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{alert.warning}</p>
                                <p className="text-[8px] text-slate-400 mt-1">
                                  {new Date(alert.receivedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize leading-tight">
                  {user.role.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-slate-200 overflow-y-auto z-30 transition-transform duration-200
            lg:static lg:translate-x-0 lg:h-auto lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="p-3 space-y-0.5">
            {/* Home Link */}
            <Link href="/dashboard">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-600 hover:text-slate-900">
                <Home className="w-4.5 h-4.5" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
            </Link>

            <div className="h-px bg-slate-100 my-2" />

            {/* Dynamic Navigation Items */}
            {sidebarItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 transition cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <div className="text-slate-400 group-hover:text-teal-600 transition">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                      {item.label}
                    </span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            <div className="h-px bg-slate-100 my-2" />

            {/* Settings */}
            <Link href="/dashboard/settings">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-400 hover:text-slate-600">
                <Settings className="w-4.5 h-4.5" />
                <span className="text-sm font-medium">Settings</span>
              </div>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
