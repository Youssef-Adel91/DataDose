'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Pill, Shield } from 'lucide-react';

interface DrugItem {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
}

export default function PrescriptionCreator({
  onCheck,
  isChecking = false,
  onSubmit,
  quotaExceeded = false,
  onDismissPaywall,
}: {
  onCheck?: (drugs: DrugItem[]) => Promise<{ ok: boolean; hasCriticalRisk?: boolean; message?: string }>;
  isChecking?: boolean;
  onSubmit?: (drugs: DrugItem[]) => Promise<{ ok: boolean; quotaExceeded?: boolean; message?: string }>;
  quotaExceeded?: boolean;
  onDismissPaywall?: () => void;
}) {
  const [drugs, setDrugs] = useState<DrugItem[]>([
    { id: 1, name: 'Metformin', dosage: '500mg', frequency: '2x daily' },
  ]);
  const [newDrug, setNewDrug] = useState({ name: '', dosage: '', frequency: '' });
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedInteractions, setHasCheckedInteractions] = useState(false);
  const [hasCriticalRisk, setHasCriticalRisk] = useState(false);
  const [overrideCriticalRisk, setOverrideCriticalRisk] = useState(false);

  const addDrug = () => {
    if (newDrug.name && newDrug.dosage && newDrug.frequency) {
      const alreadyExists = drugs.some(
        (drug) => drug.name.trim().toLowerCase() === newDrug.name.trim().toLowerCase()
      );
      if (alreadyExists) {
        setFormMessage('Medication already added');
        return;
      }
      setDrugs([
        ...drugs,
        {
          id: Math.max(...drugs.map((d) => d.id), 0) + 1,
          name: newDrug.name.trim(),
          dosage: newDrug.dosage.trim(),
          frequency: newDrug.frequency,
        },
      ]);
      setFormMessage('');
      setHasCheckedInteractions(false);
      setHasCriticalRisk(false);
      setOverrideCriticalRisk(false);
      setNewDrug({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeDrug = (id: number) => {
    setDrugs(drugs.filter((d) => d.id !== id));
    setHasCheckedInteractions(false);
    setHasCriticalRisk(false);
    setOverrideCriticalRisk(false);
  };

  const handleCheckInteractions = async () => {
    if (!onCheck) return;
    setFormMessage('');
    const result = await onCheck(drugs);
    if (result.ok) {
      setHasCheckedInteractions(true);
      setHasCriticalRisk(!!result.hasCriticalRisk);
      if (!result.hasCriticalRisk) setOverrideCriticalRisk(false);
      if (result.hasCriticalRisk) {
        setFormMessage(result.message || 'Critical risk detected. Override is required to submit.');
      }
    } else {
      setHasCheckedInteractions(false);
      setHasCriticalRisk(false);
      setOverrideCriticalRisk(false);
      if (result.message) setFormMessage(result.message);
    }
  };

  const handleVerifySubmit = async () => {
    if (!onSubmit || drugs.length === 0 || quotaExceeded || !hasCheckedInteractions) return;
    if (hasCriticalRisk && !overrideCriticalRisk) {
      setFormMessage('Critical risk detected. Check override to proceed.');
      return;
    }
    setIsSubmitting(true);
    setFormMessage('');
    try {
      const result = await onSubmit(drugs);
      if (!result.ok) {
        setFormMessage(result.message || 'Unable to submit prescription.');
      } else {
        setFormMessage('Prescription submitted successfully.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-slate-900 mb-4">Add Medication</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Drug name (e.g., Metformin)"
              value={newDrug.name}
              onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
              className="bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
            <input
              type="text"
              placeholder="Dosage (e.g., 500mg)"
              value={newDrug.dosage}
              onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
              className="bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
            />
            <select
              value={newDrug.frequency}
              onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
              className={`bg-white/50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition ${!newDrug.frequency ? 'text-slate-400' : 'text-slate-900'}`}
            >
              <option value="" disabled>Select frequency</option>
              <option value="1x daily">1x daily</option>
              <option value="2x daily">2x daily</option>
              <option value="3x daily">3x daily</option>
              <option value="As needed">As needed</option>
            </select>

            <motion.button
              whileHover={newDrug.name && newDrug.dosage && newDrug.frequency ? { scale: 1.02 } : {}}
              whileTap={newDrug.name && newDrug.dosage && newDrug.frequency ? { scale: 0.98 } : {}}
              onClick={addDrug}
              disabled={!newDrug.name || !newDrug.dosage || !newDrug.frequency}
              className={`font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                !newDrug.name || !newDrug.dosage || !newDrug.frequency
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-teal text-white hover:shadow-lg'
              }`}
            >
              <Plus className="w-5 h-5" />
              Add
            </motion.button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckInteractions}
            disabled={isChecking}
            className="flex-1 bg-gradient-teal text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
          >
            {isChecking ? 'Scanning Knowledge Graph...' : 'Check Interactions'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifySubmit}
            disabled={
              drugs.length === 0 ||
              quotaExceeded ||
              isSubmitting ||
              !hasCheckedInteractions ||
              (hasCriticalRisk && !overrideCriticalRisk)
            }
            className={`flex-1 font-semibold py-3 rounded-lg transition ${
              drugs.length === 0 || quotaExceeded || isSubmitting
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-mint-500 text-white hover:bg-mint-600'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Verify & Submit'}
          </motion.button>
        </div>
        {hasCriticalRisk && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overrideCriticalRisk}
              onChange={(e) => setOverrideCriticalRisk(e.target.checked)}
            />
            Override Warning & Assume Liability
          </label>
        )}
        {formMessage && (
          <p className={`text-sm ${formMessage.toLowerCase().includes('success') ? 'text-green-700' : 'text-red-600'}`}>
            {formMessage}
          </p>
        )}
      </div>

      {quotaExceeded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/90 border border-white/40 shadow-2xl rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-teal rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Daily Limit Reached</h3>
            <p className="text-sm text-slate-700 mb-5">
              رصيدك المجاني خلص. Upgrade to Pro to continue interaction checks and submission.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDismissPaywall}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Not now
              </button>
              <button className="px-4 py-2 rounded-lg bg-gradient-teal text-white font-semibold">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
