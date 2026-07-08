'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from './animations';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor?: string; // tailwind text color class e.g. "text-teal-600"
  loading?: boolean;
}

/**
 * Reusable metric card for all dashboards.
 * Shows a label, value, and icon with a consistent clinical design.
 */
export default function StatCard({
  label,
  value,
  icon,
  accentColor = 'text-teal-600',
  loading = false,
}: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 ${accentColor}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
        {label}
      </h3>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mt-1.5" />
      ) : (
        <p className={`text-2xl font-bold mt-1 ${accentColor}`}>
          {value}
        </p>
      )}
    </motion.div>
  );
}
