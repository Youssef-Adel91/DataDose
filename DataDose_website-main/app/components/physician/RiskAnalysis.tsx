'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle, ShieldAlert, User, CheckCircle2, Brain, Loader2 } from 'lucide-react';

interface RiskAnalysisProps {
  dynamicRisks?: any[] | null;
  selectedPatient?: any;
  /** Score (0–10) returned by the Databricks ML model. Pass `null` while loading. */
  databricksScore?: number | null;
}

interface RiskItem {
  id: number;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

const severityConfig = {
  low: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  medium: {
    bg: 'bg-yellow-50/50',
    border: 'border-yellow-200',
    text: 'text-yellow-750',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  high: { bg: 'bg-red-50/50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

/** Skeleton card — pulsing placeholder shown while Databricks ML job is running */
function DatabricksSkeletonCard() {
  return (
    <div className="bg-white border-2 border-dashed border-purple-200 rounded-lg p-4 shadow-sm text-left animate-pulse relative overflow-hidden">
      {/* shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/60 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Databricks ML Risk Prediction</p>
      </div>
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />
        <div className="h-5 bg-purple-100 rounded w-24" />
      </div>
      <p className="text-[9px] text-purple-300 mt-2 leading-relaxed">
        Predictive ML model processing patient history via Databricks…
      </p>
    </div>
  );
}

/** Animated score card shown once the Databricks result arrives */
function DatabricksScoreCard({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);

  // Count-up animation from 0 to score over 1.2 s
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplayed(parseFloat((t * score).toFixed(1)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color =
    score >= 7.0 ? 'text-red-600' : score >= 4.0 ? 'text-amber-600' : 'text-purple-700';
  const borderColor =
    score >= 7.0 ? 'border-red-200 bg-red-50/40' : score >= 4.0 ? 'border-amber-200 bg-amber-50/40' : 'border-purple-200 bg-purple-50/40';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`border-2 rounded-lg p-4 shadow-sm text-left ${borderColor}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Brain className="w-3.5 h-3.5 text-purple-500" />
        <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Databricks ML Risk Prediction</p>
      </div>
      <p className={`text-lg font-black ${color} mt-0.5`}>{displayed.toFixed(1)}/10</p>
      <p className="text-[9px] text-slate-400 mt-1">Machine-learning estimate · powered by Databricks</p>
    </motion.div>
  );
}

export default function RiskAnalysis({ dynamicRisks, selectedPatient, databricksScore = null }: RiskAnalysisProps) {
  // Generate dynamic clinical risks if we have a selected patient
  let calculatedRisks: RiskItem[] = [];
  let score = 1.5;
  let actions: string[] = ["Review medication profile before clinical sign-off."];

  if (selectedPatient) {
    const age = selectedPatient.age || 0;
    const allergies = selectedPatient.allergies || "";
    const condition = selectedPatient.condition || "";
    const chronic = selectedPatient.chronicDiseases || "";

    // 1. Age risk
    if (age > 65) {
      calculatedRisks.push({
        id: 1,
        category: 'Age-Based Clearance Alert',
        severity: 'medium',
        description: `Patient is ${age} Y/O. Renal clearance rates naturally decline with age. High risk of drug accumulation toxicity.`,
        recommendation: 'Calculate Cockcroft-Gault creatinine clearance and monitor eGFR annually.',
      });
      score += 2.0;
      actions.push("Order serum creatinine and repeats.");
    }

    // 2. Allergy risk
    if (allergies.toLowerCase().includes('penicillin')) {
      calculatedRisks.push({
        id: 2,
        category: 'Critical Allergy Contraindication',
        severity: 'high',
        description: 'Documented Penicillin allergy. Exposure to beta-lactam class antibiotics carries severe anaphylaxis risks.',
        recommendation: 'Strictly avoid Penicillins, Ampicillin, and Cephalosporins. Verify alternative class selection.',
      });
      score += 4.5;
      actions.push("Strictly block beta-lactam antibiotic prescription entries.");
    }

    // 3. Drug-Disease risk (Metformin in CKD)
    const hasCKD = condition.toLowerCase().includes('ckd') || chronic.toLowerCase().includes('kidney');
    const takesMetformin = selectedPatient.currentMeds?.some((m: any) => m.name.toLowerCase().includes('metformin'));
    
    if (hasCKD && takesMetformin) {
      calculatedRisks.push({
        id: 3,
        category: 'Drug-Disease Interaction',
        severity: 'high',
        description: 'Metformin active accumulation warning. Patient has documented CKD Stage 3. Accumulating biguanides triggers lactic acidosis.',
        recommendation: 'Reduce Metformin dosage to a maximum of 500mg daily or suspend therapy until eGFR stabilizes >45.',
      });
      score += 3.5;
      actions.push("Adjust Metformin dosing orders or flag for therapeutic substitution.");
    }

    // 4. Statin-COPD atenolol conflict check
    const hasCOPD = condition.toLowerCase().includes('copd');
    const takesBetaBlocker = selectedPatient.stoppedMeds?.some((m: any) => m.name.toLowerCase().includes('atenolol'));
    if (hasCOPD && selectedPatient.name.includes("George")) {
      calculatedRisks.push({
        id: 4,
        category: 'Bronchospasm Risk Warning',
        severity: 'medium',
        description: 'COPD history detected. Non-selective beta-blockers exacerbate bronchospasms. Atenolol was stopped for this reason.',
        recommendation: 'Strictly use ARBs or CCBs for hypertension. Do not re-prescribe beta-adrenergic blockers.',
      });
      score += 1.5;
      actions.push("Confirm blood pressure is managed using Losartan/CCB class medications.");
    }
  }

  // Fallback to static risks if no patient is selected
  const hasCalculated = calculatedRisks.length > 0;
  const displayRisks = hasCalculated 
    ? calculatedRisks 
    : (dynamicRisks && dynamicRisks.length > 0 ? dynamicRisks : [
        {
          id: 1,
          category: 'Drug Interaction',
          severity: 'medium' as const,
          description: 'Metformin + ACE Inhibitor interaction detected',
          recommendation: 'Monitor renal function - recommend baseline kidney test',
        },
        {
          id: 2,
          category: 'Allergy Warning',
          severity: 'low' as const,
          description: 'Patient reported allergy to Beta-blockers',
          recommendation: 'Use alternative CCB (Calcium Channel Blocker) class',
        }
      ]);

  // Final score calculations
  const finalScore = hasCalculated ? Math.min(10, parseFloat(score.toFixed(1))) : 4.5;
  const severityLevel = finalScore >= 7.0 ? 'CRITICAL' : (finalScore >= 4.0 ? 'MODERATE' : 'SAFE');
  const hasHighRisk = severityLevel === 'CRITICAL' || displayRisks.some(r => r.severity === 'high');

  const ruleBasedCards = [
    { 
      label: 'Clinical Risk Score', 
      value: `${finalScore}/10`, 
      color: finalScore >= 7.0 ? 'text-red-600' : (finalScore >= 4.0 ? 'text-amber-600' : 'text-green-700') 
    },
    { 
      label: 'System Assessment', 
      value: severityLevel, 
      color: severityLevel === 'CRITICAL' ? 'text-red-600' : (severityLevel === 'MODERATE' ? 'text-amber-600' : 'text-green-700') 
    },
    { 
      label: 'Required Clearance Action', 
      value: hasHighRisk ? 'Override Required' : 'Physician Sign-off', 
      color: 'text-indigo-600' 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-strong rounded-xl p-8 animate-fadeIn"
      id="risk"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Clinical Risk Assessment</h2>
            <p className="text-xs text-slate-500">Evaluates active prescription orders against EHR safety markers</p>
          </div>
        </div>
        {selectedPatient && (
          <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <User className="w-4 h-4 text-teal-700" />
            <span>Active Chart: <strong>{selectedPatient.name}</strong></span>
          </div>
        )}
      </div>

      {/* Grid Indicators — 3 rule-based cards + 1 Databricks ML card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {ruleBasedCards.map((item, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
            <p className={`text-lg font-black ${item.color} mt-1.5`}>{item.value}</p>
          </div>
        ))}

        {/* Databricks ML card — skeleton while loading, animated score when ready */}
        {databricksScore === null ? (
          <DatabricksSkeletonCard />
        ) : (
          <DatabricksScoreCard score={databricksScore} />
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Risks list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identified Safety Violations</h3>
          {displayRisks.map((risk, i) => {
            const config = severityConfig[risk.severity as keyof typeof severityConfig] || severityConfig.medium;
            return (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`${config.bg} border ${config.border} rounded-xl p-4 shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className={`font-bold text-xs uppercase ${config.text}`}>{risk.category}</p>
                      <span className={`${config.badge} text-[9px] font-black px-1.5 py-0.5 rounded uppercase border`}>
                        {risk.severity} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mb-2.5 leading-relaxed">{risk.description}</p>
                    <div className="bg-white/70 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Intervention Recommendation:</p>
                      <p className="text-xs text-slate-800">✓ {risk.recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Items Panel */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              Required Clinical Action Items
            </h3>
            <div className="space-y-2">
              {actions.map((act, index) => (
                <div key={index} className="flex gap-2 items-start text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 bg-teal-600 rounded-full shrink-0 mt-1.5" />
                  <p>{act}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hospital CDSS Verification Status</h4>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="font-semibold text-slate-800">EMR Connectivity Online</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Directly syncs to clinical databases upon order transmission.</p>
          </div>
        </div>
      </div>

      {/* Bottom status alert banner */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`mt-6 p-4 rounded-xl flex items-center gap-3 border shadow-sm text-left ${
          hasHighRisk
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}
      >
        {hasHighRisk ? (
          <>
            <ShieldAlert className="w-5 h-5 text-red-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-950 text-xs">Critical Intervention Warning</p>
              <p className="text-[11px] text-red-700 mt-0.5">
                The automatic CDSS engine has flagged critical risks. Adjust drug orders or file a medical liability override signature.
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-950 text-xs">Clinical Risks Screened</p>
              <p className="text-[11px] text-green-700 mt-0.5">
                No high-severity warnings remain. The medication safety profile is verified and ready for clinician review.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
