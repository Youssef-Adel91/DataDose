'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

const chartData = [
  { date: 'Mon', prescriptions: 285, alerts: 12, interactions: 8 },
  { date: 'Tue', prescriptions: 412, alerts: 18, interactions: 11 },
  { date: 'Wed', prescriptions: 325, alerts: 15, interactions: 9 },
  { date: 'Thu', prescriptions: 498, alerts: 24, interactions: 14 },
  { date: 'Fri', prescriptions: 567, alerts: 31, interactions: 18 },
];

export default function HospitalAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
      id="analytics"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Hospital Analytics</h2>
        <BarChart3 className="w-6 h-6 text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions Chart */}
        <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Weekly Prescriptions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prescriptions" 
                stroke="#14b8a6" 
                strokeWidth={2}
                dot={{ fill: '#14b8a6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Trend */}
        <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Safety Alerts Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="alerts" fill="#f59e0b" />
              <Bar dataKey="interactions" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Avg Per Day', value: '417', trend: '+12%' },
          { label: 'Peak Hour', value: '14:30', trend: '9-5 PM' },
          { label: 'Risk Avg', value: '3.2/10', trend: 'MODERATE' },
        ].map((item, i) => (
          <div key={i} className="bg-gradient-teal-light rounded-lg p-4 border border-teal-200">
            <p className="text-xs text-slate-600 font-medium">{item.label}</p>
            <p className="text-2xl font-bold text-teal-900 mt-2">{item.value}</p>
            <p className="text-xs text-teal-700 font-semibold mt-1">{item.trend}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
