'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pill, ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft, Shield, AlertTriangle, ArrowRight, Activity, HelpCircle, User } from 'lucide-react';
import { patients } from './PatientEHR';

interface MedicationItem {
  id: number;
  name: string;
  activeIngredient: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function PrescriptionCreator({
  selectedPatient,
  onCheck,
  isChecking = false,
  onSubmit,
  quotaExceeded = false,
  onDismissPaywall,
  onViewAlternatives,
}: {
  selectedPatient: any;
  onCheck?: (drugs: any[]) => Promise<{ ok: boolean; hasCriticalRisk?: boolean; message?: string }>;
  isChecking?: boolean;
  onSubmit?: (drugs: any[]) => Promise<{ ok: boolean; quotaExceeded?: boolean; message?: string }>;
  quotaExceeded?: boolean;
  onDismissPaywall?: () => void;
  onViewAlternatives?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [patient, setPatient] = useState<any>(selectedPatient || patients[0]);
  const [drugs, setDrugs] = useState<MedicationItem[]>([
    {
      id: 1,
      name: 'Metformin',
      activeIngredient: 'Biguanide',
      dose: '500mg',
      frequency: '2x daily',
      duration: '90 days',
      instructions: 'Take with food to avoid gastrointestinal irritation.'
    }
  ]);

  const [newDrug, setNewDrug] = useState({
    name: '',
    activeIngredient: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [wizardMessage, setWizardMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyReport, setSafetyReport] = useState<{
    severity: 'safe' | 'warning' | 'critical';
    score: number;
    issues: Array<{ type: string; level: 'high' | 'medium' | 'low'; text: string; action: string }>;
  } | null>(null);

  const [overrideReason, setOverrideReason] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  // Sync patient if changed externally from PatientEHR
  useEffect(() => {
    if (selectedPatient) {
      setPatient(selectedPatient);
    }
  }, [selectedPatient]);

  const addDrug = () => {
    if (newDrug.name && newDrug.dose && newDrug.frequency && newDrug.duration) {
      const alreadyExists = drugs.some(
        (drug) => drug.name.trim().toLowerCase() === newDrug.name.trim().toLowerCase()
      );
      if (alreadyExists) {
        setWizardMessage('Medication already added');
        return;
      }
      setDrugs([
        ...drugs,
        {
          id: Math.max(...drugs.map((d) => d.id), 0) + 1,
          name: newDrug.name.trim(),
          activeIngredient: newDrug.activeIngredient.trim() || newDrug.name.trim(),
          dose: newDrug.dose.trim(),
          frequency: newDrug.frequency,
          duration: newDrug.duration.trim(),
          instructions: newDrug.instructions.trim() || 'Take as directed.'
        },
      ]);
      setWizardMessage('');
      setNewDrug({ name: '', activeIngredient: '', dose: '', frequency: '', duration: '', instructions: '' });
    }
  };

  const removeDrug = (id: number) => {
    setDrugs(drugs.filter((d) => d.id !== id));
  };

  // Run Safety Checks (Step 3 to 4 transition) — calls real FastAPI /api/scan
  const runSafetyChecks = async () => {
    setStep(3);
    setWizardMessage('');
    setOverrideConfirmed(false);
    setOverrideReason('');

    const drugNames = drugs.map((d) => d.name.trim()).filter(Boolean);
    const allergyList = patient.allergies
      ? patient.allergies.split(/[,;]+/).map((a: string) => a.trim()).filter(Boolean)
      : [];

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs: drugNames, allergies: allergyList }),
      });

      const data = await res.json();

      // Map backend interactions to the issues array the UI expects
      const issues: Array<{ type: string; level: 'high' | 'medium' | 'low'; text: string; action: string }> = [];

      const interactions: any[] = data.interactions ?? [];
      const summary = data.summary ?? {};

      const allergyAlerts: number = summary.allergyAlerts ?? 0;
      const fatalSevere: number   = summary.fatalSevere   ?? 0;
      const majorCount: number    = summary.major         ?? 0;

      for (const item of interactions) {
        const sev = (item.severity ?? '').toLowerCase();
        const level: 'high' | 'medium' | 'low' =
          sev === 'fatal' || sev === 'severe' || sev === 'allergy' ? 'high'
          : sev === 'major' ? 'medium'
          : 'low';

        const typeLabel =
          sev === 'allergy' ? 'Drug-Allergy Contraindication'
          : sev === 'fatal' || sev === 'severe' ? 'Drug-Drug Interaction (Critical)'
          : 'Drug-Drug Interaction';

        issues.push({
          type: typeLabel,
          level,
          text: item.mechanism ?? `${item.drug1} + ${item.drug2}: interaction detected.`,
          action: item.recommendation ?? item.effect ?? 'Consult prescribing physician before dispensing.',
        });
      }

      // Derive a 1–10 safety score from the interaction severity weights
      // Lower score = safer (inverted scale, matches existing component convention)
      let score = 2.0;  // base "all clear" score
      score += allergyAlerts * 4.5;
      score += fatalSevere  * 3.5;
      score += majorCount   * 2.0;
      score = Math.min(10, parseFloat(score.toFixed(1)));

      // Assessment:
      // - 'critical' when ANY allergy alert, fatal/severe DDI, or score >= 7
      // - 'warning'  when major DDI or score >= 4
      // - 'safe'     only when no interactions at all
      let severity: 'safe' | 'warning' | 'critical' = 'safe';
      if (majorCount > 0 || score >= 4.0) severity = 'warning';
      if (allergyAlerts > 0 || fatalSevere > 0 || score >= 7.0 || issues.some((i) => i.level === 'high')) {
        severity = 'critical';
      }

      setSafetyReport({ severity, score, issues });
      setStep(4);
    } catch (err: any) {
      // Fallback: show a generic critical alert so we never silently pass a broken check
      setSafetyReport({
        severity: 'critical',
        score: 0,
        issues: [{
          type: 'Safety Check Error',
          level: 'high',
          text: `Safety check engine returned an error: ${err?.message ?? 'Unknown error'}. DO NOT dispense until resolved.`,
          action: 'Contact IT support or retry. Do not proceed without a confirmed safety report.',
        }],
      });
      setStep(4);
    }
  };


  const handleVerifySubmit = async () => {
    if (!onSubmit || drugs.length === 0 || quotaExceeded) return;
    if (safetyReport?.severity === 'critical' && (!overrideConfirmed || !overrideReason.trim())) {
      setWizardMessage('Override signature and clinical justification reasons are required to proceed.');
      return;
    }
    setIsSubmitting(true);
    setWizardMessage('');
    try {
      const result = await onSubmit(drugs);
      if (!result.ok) {
        setWizardMessage(result.message || 'Unable to submit prescription.');
      } else {
        setWizardMessage('Prescription submitted successfully. Logs updated.');
        // Reset wizard
        setTimeout(() => {
          setDrugs([]);
          setStep(1);
          setSafetyReport(null);
          setWizardMessage('');
        }, 2000);
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
      className="glass-card-strong rounded-xl p-8 animate-fadeIn"
      id="prescription"
    >
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create Prescription</h2>
          <p className="text-xs text-slate-500 mt-1">Multi-step safety checked prescription creator</p>
        </div>
        <Pill className="w-6 h-6 text-teal-600" />
      </div>

      {/* Step Tracker Indicator */}
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
        {[
          { num: 1, label: 'Patient' },
          { num: 2, label: 'Medications' },
          { num: 3, label: 'Safety Check' },
          { num: 4, label: 'Review & Submit' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              step === s.num
                ? 'bg-teal-700 text-white shadow-sm scale-110'
                : step > s.num
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.num ? <CheckCircle2 className="w-4.5 h-4.5" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step === s.num ? 'text-teal-800' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {s.num < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Steps Content Panels */}
      <div className="min-h-[280px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Verify Patient */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 text-left"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Target Patient</label>
                <select
                  value={patient.id}
                  onChange={(e) => {
                    const selected = patients.find(p => p.id === Number(e.target.value));
                    if (selected) setPatient(selected);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Patient-{p.id})</option>
                  ))}
                </select>
              </div>

              {/* Patient EHR Summary card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-700" />
                  EHR Verification Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Name / Age</span>
                    <span className="font-bold text-slate-800">{patient.name} ({patient.age} Y/O)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Gender</span>
                    <span className="font-bold text-slate-800">{patient.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Chronic Diseases</span>
                    <span className="font-bold text-slate-800 truncate block max-w-[120px]">{patient.chronicDiseases}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Documented Allergies</span>
                    <span className={`font-bold ${patient.allergies.toLowerCase().includes('none') ? 'text-slate-800' : 'text-red-600'}`}>
                      {patient.allergies}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2 px-5 rounded-lg text-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  Confirm & Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Add Medications */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 text-left animate-fadeIn"
            >
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Medications List ({drugs.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {drugs.map((drug) => (
                    <div
                      key={drug.id}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Pill className="w-5 h-5 text-teal-600" />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{drug.name} ({drug.dose})</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Ingredient: <span className="font-semibold text-slate-600">{drug.activeIngredient}</span> • {drug.frequency} • {drug.duration}
                          </p>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">Note: {drug.instructions}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDrug(drug.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {drugs.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No medications added yet. Add one below.</p>
                  )}
                </div>
              </div>

              {/* Add form */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">Add New Medicine</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lisinopril"
                      value={newDrug.name}
                      onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Active Ingredient</label>
                    <input
                      type="text"
                      placeholder="e.g. ACE Inhibitor (Optional)"
                      value={newDrug.activeIngredient}
                      onChange={(e) => setNewDrug({ ...newDrug, activeIngredient: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 10mg, 500mg"
                      value={newDrug.dose}
                      onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                    <select
                      value={newDrug.frequency}
                      onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition text-slate-900"
                    >
                      <option value="" disabled>Select frequency</option>
                      <option value="1x daily">1x daily</option>
                      <option value="2x daily">2x daily</option>
                      <option value="3x daily">3x daily</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days, 90 days"
                      value={newDrug.duration}
                      onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Take with food"
                      value={newDrug.instructions}
                      onChange={(e) => setNewDrug({ ...newDrug, instructions: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={addDrug}
                    disabled={!newDrug.name || !newDrug.dose || !newDrug.frequency || !newDrug.duration}
                    className={`font-semibold py-1.5 px-4 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      !newDrug.name || !newDrug.dose || !newDrug.frequency || !newDrug.duration
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-teal-700 text-white hover:bg-teal-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Medication
                  </button>
                </div>
              </div>

              {wizardMessage && <p className="text-xs text-red-650 font-medium">{wizardMessage}</p>}

              <div className="flex justify-between border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={runSafetyChecks}
                  disabled={drugs.length === 0}
                  className={`font-semibold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    drugs.length === 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                  }`}
                >
                  Run Safety Checks
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Safety Check Loading */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mb-4" />
              <p className="font-semibold text-slate-800 text-sm">Evaluating Clinical Safety Matrix…</p>
              <div className="max-w-xs text-center space-y-1.5 mt-3">
                <p className="text-[10px] text-slate-400 animate-pulse">✓ Checking Drug-Drug Interactions (DDI)</p>
                <p className="text-[10px] text-slate-400 animate-pulse">✓ Parsing Patient EHR Allergy Contraindications</p>
                <p className="text-[10px] text-slate-400 animate-pulse">✓ Checking Active Ingredient Duplications</p>
                <p className="text-[10px] text-slate-400 animate-pulse">✓ Calculating age-based risk indexes</p>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review and Submit */}
          {step === 4 && safetyReport && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 text-left animate-fadeIn"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Medication Safety Report</h3>
                  <p className="text-[10px] text-slate-500">Patient: {patient.name} ({patient.age} Y/O)</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-center">
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Safety Score</span>
                    <span className={`text-sm font-black ${
                      safetyReport.severity === 'critical' ? 'text-red-600' :
                      safetyReport.severity === 'warning' ? 'text-yellow-600' : 'text-green-700'
                    }`}>
                      {safetyReport.score}/10
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-center">
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Assessment</span>
                    <span className={`text-[10px] font-black uppercase ${
                      safetyReport.severity === 'critical' ? 'text-red-600 animate-pulse' :
                      safetyReport.severity === 'warning' ? 'text-yellow-650' : 'text-green-700'
                    }`}>
                      {safetyReport.severity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issues Alerts stack */}
              <div className="space-y-3">
                {safetyReport.issues.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-green-950 text-xs">No Safety Violations Detected</p>
                      <p className="text-[11px] text-green-700 mt-0.5">The prescription is safe to proceed under primary guidelines. No active ingredient duplications or drug interactions detected.</p>
                    </div>
                  </div>
                ) : (
                  safetyReport.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 flex gap-3 ${
                        issue.level === 'high'
                          ? 'bg-red-50/50 border-red-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        issue.level === 'high' ? 'text-red-650' : 'text-amber-650'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-xs uppercase ${
                            issue.level === 'high' ? 'text-red-950' : 'text-amber-950'
                          }`}>{issue.type}</p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                            issue.level === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {issue.level} Risk
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-1">{issue.text}</p>
                        <p className="text-[10px] text-teal-850 font-medium bg-white/60 p-2 rounded-lg border border-slate-100 mt-2">
                          <strong>Clinical Recommendation:</strong> {issue.action}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Override controls */}
              {safetyReport.severity === 'critical' && (
                <div className="bg-red-950/80 border border-red-700 rounded-xl p-4 text-white shadow-md">
                  <div className="flex gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Medical Override Verification Required</h4>
                      <p className="text-[10px] text-red-200 mt-0.5">Critical contraindications exist. Hospital safety regulations require a signed override reason to transmit this order.</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <textarea
                      placeholder="Enter clinical justification reason (e.g. Alternative therapies exhausted. Benefits outweigh allergy rash risk under close observation...)"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full bg-black/40 border border-red-500 rounded-lg p-2 text-xs text-white placeholder:text-red-300/60 focus:outline-none focus:ring-1 focus:ring-red-400"
                      rows={2}
                    />
                    <label className="flex items-center gap-2 text-xs text-red-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overrideConfirmed}
                        onChange={(e) => setOverrideConfirmed(e.target.checked)}
                        className="rounded border-red-500 text-red-600 focus:ring-red-400 focus:ring-offset-red-900 bg-black/40"
                      />
                      I verify this override and assume clinical liability for this therapy combination.
                    </label>
                  </div>
                </div>
              )}

              {wizardMessage && (
                <p className={`text-xs font-semibold ${wizardMessage.toLowerCase().includes('success') ? 'text-green-700' : 'text-red-650'}`}>
                  {wizardMessage}
                </p>
              )}

              {/* Footer controls */}
              <div className="flex justify-between border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Modify Prescription
                </button>
                <div className="flex gap-2">
                  {safetyReport.severity === 'critical' && onViewAlternatives && (
                    <button
                      onClick={onViewAlternatives}
                      className="border border-teal-300 text-teal-850 bg-teal-50/50 hover:bg-teal-50 font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-teal-700" />
                      View Alternatives
                    </button>
                  )}
                  <button
                    onClick={handleVerifySubmit}
                    disabled={
                      isSubmitting ||
                      (safetyReport.severity === 'critical' && (!overrideConfirmed || !overrideReason.trim()))
                    }
                    className={`font-semibold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      isSubmitting || (safetyReport.severity === 'critical' && (!overrideConfirmed || !overrideReason.trim()))
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-teal-700 text-white hover:bg-teal-800 hover:shadow'
                    }`}
                  >
                    {isSubmitting ? 'Submitting Order…' : 'Submit Prescription'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {quotaExceeded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/90 border border-white/40 shadow-2xl rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-teal rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Daily Limit Reached</h3>
            <p className="text-sm text-slate-700 mb-5">
              Your daily free scan allowance is complete. Upgrade to Pro to continue real-time interaction checks and submit prescriptions.
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
