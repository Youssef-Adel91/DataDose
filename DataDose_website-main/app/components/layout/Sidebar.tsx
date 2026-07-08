'use client';

import React from 'react';
import { Home } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeFeature: string;
  setActiveFeature: (featureId: string) => void;
  sidebarOpen: boolean;
  onCloseSidebar?: () => void;
}

export default function Sidebar({
  menuItems,
  activeFeature,
  setActiveFeature,
  sidebarOpen,
  onCloseSidebar,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar navigation list */}
      <aside
        className={`
          fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-slate-200 overflow-y-auto z-30 transition-transform duration-200
          lg:static lg:translate-x-0 lg:h-auto lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-3 space-y-0.5 animate-fadeIn">
          {/* Home Link (Dashboard Overview) */}
          <button
            onClick={() => {
              setActiveFeature('dashboard');
              if (onCloseSidebar) onCloseSidebar();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left cursor-pointer ${
              activeFeature === 'dashboard'
                ? 'bg-teal-50 text-teal-800 font-semibold border-l-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span className="text-sm font-medium">Dashboard Overview</span>
          </button>

          <div className="h-px bg-slate-100 my-2" />

          {/* Dynamic Navigation Items */}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveFeature(item.id);
                if (onCloseSidebar) onCloseSidebar();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition text-left cursor-pointer ${
                activeFeature === item.id
                  ? 'bg-teal-50 text-teal-800 font-semibold border-l-2 border-teal-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`${activeFeature === item.id ? 'text-teal-700' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
