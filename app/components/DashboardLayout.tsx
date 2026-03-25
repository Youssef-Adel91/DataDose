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
  User,
  Settings,
  Bell,
  Heart,
} from 'lucide-react';
import Link from 'next/link';

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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Top Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card-strong border-b border-teal-200/50 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition lg:hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-teal flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Data Dose</p>
                <p className="text-xs text-slate-500">{title}</p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-72 glass-card-strong rounded-lg p-4 shadow-lg"
                >
                  <h3 className="font-semibold text-slate-900 mb-3">Notifications</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-teal-50 rounded border border-teal-200">
                      <p className="text-teal-900">✓ System updated successfully</p>
                      <p className="text-xs text-teal-700">5 minutes ago</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-blue-900">New user registered</p>
                      <p className="text-xs text-blue-700">1 hour ago</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right text-sm">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-teal flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar - fixed on mobile, static on desktop */}
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 glass-card border-r border-teal-200/50 overflow-y-auto z-30 transition-transform duration-300
            lg:static lg:translate-x-0 lg:h-auto lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="p-4 space-y-2">
            {/* Home Link */}
            <Link href="/dashboard">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-teal-50 transition cursor-pointer"
              >
                <Home className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-slate-700">Dashboard</span>
              </motion.div>
            </Link>

            {/* Dynamic Navigation Items */}
            {sidebarItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-teal-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-teal-600 group-hover:text-teal-700 transition">
                      {item.icon}
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-slate-900">
                      {item.label}
                    </span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))}

            {/* Divider */}
            <div className="my-4 h-px bg-slate-200" />

            {/* Settings */}
            <Link href="/dashboard/settings">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-600">Settings</span>
              </motion.div>
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
