'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Pill } from 'lucide-react';

interface DrugItem {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
}

export default function PrescriptionCreator() {
  const [drugs, setDrugs] = useState<DrugItem[]>([
    { id: 1, name: 'Metformin', dosage: '500mg', frequency: '2x daily' },
  ]);
  const [newDrug, setNewDrug] = useState({ name: '', dosage: '', frequency: '' });

  const addDrug = () => {
    if (newDrug.name && newDrug.dosage && newDrug.frequency) {
      setDrugs([
        ...drugs,
        {
          id: Math.max(...drugs.map((d) => d.id), 0) + 1,
          ...newDrug,
        },
      ]);
      setNewDrug({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeDrug = (id: number) => {
    setDrugs(drugs.filter((d) => d.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-strong rounded-xl p-8"
      id="prescription"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create Prescription</h2>
        <Pill className="w-6 h-6 text-teal-600" />
      </div>

      <div className="space-y-6">
        {/* Current Drugs */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Selected Medications</h3>
          <div className="space-y-2">
            {drugs.map((drug) => (
              <motion.div
                key={drug.id}
                whileHover={{ x: 4 }}
                className="bg-white/50 border border-teal-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{drug.name}</p>
                    <p className="text-xs text-slate-600">
                      {drug.dosage} • {drug.frequency}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => removeDrug(drug.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add New Drug */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-slate-900 mb-4">Add Medication</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Drug name"
              value={newDrug.name}
              onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
              className="bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
            <input
              type="text"
              placeholder="Dosage"
              value={newDrug.dosage}
              onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
              className="bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
            <input
              type="text"
              placeholder="Frequency"
              value={newDrug.frequency}
              onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
              className="bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addDrug}
              className="bg-gradient-teal text-white font-semibold rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </motion.button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-teal text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
          >
            Check Interactions
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-mint-500 text-white font-semibold py-3 rounded-lg hover:bg-mint-600 transition"
          >
            Verify & Submit
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
