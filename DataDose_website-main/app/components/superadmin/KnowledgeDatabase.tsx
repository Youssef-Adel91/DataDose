'use client';

import { motion } from 'framer-motion';
import { Database, RefreshCw, TrendingUp, Download } from 'lucide-react';

const knowledgeStats = [
  {
    category: 'Medications',
    count: '45,230',
    updated: '2025-03-15',
    verified: '99.8%',
  },
  {
    category: 'Interactions',
    count: '128,450',
    updated: '2025-03-14',
    verified: '99.6%',
  },
  {
    category: 'Contraindications',
    count: '32,100',
    updated: '2025-03-13',
    verified: '99.9%',
  },
  {
    category: 'Side Effects',
    count: '156,780',
    updated: '2025-03-15',
    verified: '99.4%',
  },
];

const dataSourcesConnected = [
  { name: 'FDA Database', status: 'Connected', lastSync: '2 hours ago', records: '12.4K' },
  { name: 'PubMed API', status: 'Connected', lastSync: '1 hour ago', records: '285K' },
  { name: 'DrugBank', status: 'Connected', lastSync: '3 hours ago', records: '18.2K' },
  { name: 'WHO Database', status: 'Connected', lastSync: '6 hours ago', records: '34.1K' },
];

export default function KnowledgeDatabase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-strong rounded-xl p-8"
      id="knowledge"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Medical Knowledge Database</h2>
        <Database className="w-6 h-6 text-teal-600" />
      </div>

      {/* Knowledge Base Statistics */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Database Contents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {knowledgeStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-white/50 border border-slate-200 rounded-lg p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{stat.category}</p>
              <p className="text-2xl font-bold text-teal-600 mt-2">{stat.count}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Updated: {stat.updated}</p>
                <p className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Verified: {stat.verified}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Connected Data Sources */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-600" />
          Connected Data Sources
        </h3>

        <div className="space-y-3">
          {dataSourcesConnected.map((source, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ x: 4 }}
              className="bg-white/50 border border-slate-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="font-semibold text-slate-900">{source.name}</p>
                </div>
                <div className="flex gap-4 text-xs text-slate-600">
                  <p>Status: <span className="font-semibold text-green-700">{source.status}</span></p>
                  <p>Last Sync: <span className="font-semibold text-slate-700">{source.lastSync}</span></p>
                  <p>Records: <span className="font-semibold text-slate-700">{source.records}</span></p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="p-2 hover:bg-teal-50 rounded-lg transition text-teal-600"
              >
                <Download className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Neo4j Graph Status */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="mt-6 p-4 bg-gradient-teal-light border border-teal-200 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-teal-900">Neo4j Knowledge Graph</p>
            <p className="text-sm text-teal-800 mt-1">
              ✓ 847.2M relationships | 45.3M nodes | Last rebuild: 2 hours ago
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
          >
            Rebuild Graph
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
