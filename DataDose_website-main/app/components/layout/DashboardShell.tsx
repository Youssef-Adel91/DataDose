'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Topbar from './Topbar';
import Sidebar, { MenuItem } from './Sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  activeFeature: string;
  setActiveFeature: (featureId: string) => void;
  title: string;
}

export default function DashboardShell({
  children,
  menuItems,
  activeFeature,
  setActiveFeature,
  title,
}: DashboardShellProps) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
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

  // Get active menu label to display as subtitle in Navbar
  const activeItem = menuItems.find((item) => item.id === activeFeature);
  const activeLabel = activeFeature === 'dashboard' ? 'Overview' : activeItem?.label || 'Feature';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navbar */}
      <Topbar
        userName={user.name}
        userRole={user.role}
        activeFeatureLabel={`${title} — ${activeLabel}`}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          menuItems={menuItems}
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        {/* Scrollable Main Content area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
