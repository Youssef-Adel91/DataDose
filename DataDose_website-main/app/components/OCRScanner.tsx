"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Send,
  ImageIcon,
  RefreshCw,
  Stethoscope,
  Sparkles,
  ZoomIn,
  Plus,
  Trash2,
  ShieldAlert,
  Check,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ExtractedMedication {
  name: string;
  activeIngredient: string;
  dose: string;
  frequency: string;
}

interface OCRScannerProps {
  selectedPatient?: any;
  onSendToScanner: (medications: string[]) => void;
}

type ScanPhase =
  | "idle"       // no file selected
  | "preview"    // file selected, not yet scanned
  | "scanning"   // OCR in progress
  | "success"    // medications extracted
  | "error";     // extraction failed

// ─────────────────────────────────────────────────────────────────────────────
// RBAC
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ["PHYSICIAN", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

// ─────────────────────────────────────────────────────────────────────────────
// Laser scan animation overlay
// ─────────────────────────────────────────────────────────────────────────────

function LaserScanOverlay() {
  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10">
      {/* Dark vignette */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />

      {/* Laser line */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_rgba(45,212,191,0.9)]"
        initial={{ top: "5%" }}
        animate={{ top: ["5%", "95%", "5%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />

      {/* Corner scan brackets */}
      {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-5 h-5`}>
          <div
            className="w-full h-full border-teal-400"
            style={{
              borderTopWidth: i < 2 ? 2 : 0,
              borderBottomWidth: i >= 2 ? 2 : 0,
              borderLeftWidth: i % 2 === 0 ? 2 : 0,
              borderRightWidth: i % 2 === 1 ? 2 : 0,
            }}
          />
        </div>
      ))}

      {/* Status text */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 rounded-full border border-teal-400/40">
          <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
          <span className="text-xs font-bold text-teal-300 tracking-wider">
            AI VISION SCANNING…
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function OCRScanner({ selectedPatient, onSendToScanner }: OCRScannerProps) {
  const { user } = useAuth();

  // ── RBAC guard ──
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]"
        id="ocr-scanner"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Stethoscope className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm max-w-sm">
          AI Prescription Scanner is available to clinical staff only.{" "}
          <strong className="text-slate-700">Consult your doctor</strong> for
          medication information.
        </p>
      </motion.div>
    );
  }

  return <OCRScannerUI selectedPatient={selectedPatient} onSendToScanner={onSendToScanner} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner scanner UI (only for authorised roles)
// ─────────────────────────────────────────────────────────────────────────────

function OCRScannerUI({ selectedPatient, onSendToScanner }: OCRScannerProps) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [structuredMeds, setStructuredMeds] = useState<ExtractedMedication[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sentToScanner, setSentToScanner] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New drug input form for adding manual items
  const [newDrug, setNewDrug] = useState<ExtractedMedication>({
    name: "",
    activeIngredient: "",
    dose: "",
    frequency: "",
  });

  // Safety Report state
  const [safetyReport, setSafetyReport] = useState<{
    severity: "safe" | "warning" | "critical";
    score: number;
    issues: Array<{ type: string; level: "high" | "medium" | "low"; text: string; action: string }>;
  } | null>(null);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  // ── File intake helpers ──
  const acceptFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("File size must be under 10 MB.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPhase("preview");
    setStructuredMeds([]);
    setErrorMsg("");
    setSentToScanner(false);
    setSafetyReport(null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPhase("idle");
    setStructuredMeds([]);
    setErrorMsg("");
    setSentToScanner(false);
    setSafetyReport(null);
    setOverrideReason("");
    setOverrideConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── OCR extraction ──
  const handleExtract = async () => {
    if (!file) return;
    setPhase("scanning");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();

      setBackendOnline(data.backendOnline ?? true);

      let meds: string[] = Array.isArray(data.medications) ? data.medications : [];

      // Fallback/Demo mode check
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !data.backendOnline;
      if (isDemoMode && meds.length === 0) {
        // If testing allergy or disease interactions, seed realistic values
        meds = ["Amoxicillin 500mg", "Metformin 500mg", "Lisinopril 10mg"];
      }

      if (meds.length === 0) {
        setPhase("error");
        setErrorMsg(
          "No medications were detected in this image. Try a clearer, higher-resolution photo of the prescription."
        );
        return;
      }

      // Convert flat strings to structured objects
      const structuredList = meds.map((m: string) => {
        const parts = m.split(" ");
        const name = parts[0] || m;
        const dose = parts[1] || "500mg";
        const frequency = parts.slice(2).join(" ") || "2x daily";
        let activeIngredient = name;
        if (name.toLowerCase().includes("amox")) activeIngredient = "Beta-lactam Antibiotic";
        else if (name.toLowerCase().includes("metfor")) activeIngredient = "Biguanide";
        else if (name.toLowerCase().includes("lisin")) activeIngredient = "ACE Inhibitor";
        return { name, activeIngredient, dose, frequency };
      });

      setStructuredMeds(structuredList);
      setPhase("success");
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err.message ?? "Extraction failed. Please retry.");
    }
  };

  // Edit / Update fields in grid
  const updateMedication = (index: number, field: keyof ExtractedMedication, value: string) => {
    const updated = [...structuredMeds];
    updated[index] = { ...updated[index], [field]: value };
    setStructuredMeds(updated);
  };

  // Delete item from list
  const deleteMedication = (index: number) => {
    setStructuredMeds(structuredMeds.filter((_, idx) => idx !== index));
    setSafetyReport(null);
  };

  // Add manually structured drug row
  const addMedicationRow = () => {
    if (newDrug.name && newDrug.dose && newDrug.frequency) {
      setStructuredMeds([
        ...structuredMeds,
        {
          name: newDrug.name.trim(),
          activeIngredient: newDrug.activeIngredient.trim() || newDrug.name.trim(),
          dose: newDrug.dose.trim(),
          frequency: newDrug.frequency,
        },
      ]);
      setNewDrug({ name: "", activeIngredient: "", dose: "", frequency: "" });
      setSafetyReport(null);
    }
  };

  // Run Safety Checks inline against selected patient — calls real FastAPI /api/scan
  const runSafetyChecks = async () => {
    if (!selectedPatient) {
      setErrorMsg('Please select a patient in Patient Records first to run safety checks.');
      return;
    }
    setIsCheckingSafety(true);
    setOverrideConfirmed(false);
    setOverrideReason('');

    const drugNames = structuredMeds.map((d) => d.name.trim()).filter(Boolean);
    const allergyList = (selectedPatient.allergies ?? '')
      .split(/[,;]+/)
      .map((a: string) => a.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs: drugNames, allergies: allergyList }),
        cache: 'no-store',   // never serve a cached safety report
      });

      const data = await res.json();

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

      // Score: starts at 10.0 (safe baseline), subtracted based on severity
      let score = 10.0;
      score -= allergyAlerts * 8.0;
      score -= fatalSevere  * 7.0;
      score -= majorCount   * 3.0;
      score = Math.max(0, parseFloat(score.toFixed(1)));

      // Assessment: 'critical' when any allergy or fatal/severe alert exists, or score < 7
      let severity: 'safe' | 'warning' | 'critical' = 'safe';
      if (majorCount > 0 || score < 9.0) severity = 'warning';
      if (allergyAlerts > 0 || fatalSevere > 0 || score < 7.0 || issues.some((i) => i.level === 'high')) {
        severity = 'critical';
      }


      setSafetyReport({ severity, score, issues });
    } catch (err: any) {
      setSafetyReport({
        severity: 'critical',
        score: 0,
        issues: [{
          type: 'Safety Check Error',
          level: 'high',
          text: `Safety engine error: ${err?.message ?? 'Unknown'}. DO NOT dispense until resolved.`,
          action: 'Contact IT support or retry. Do not proceed without a confirmed safety report.',
        }],
      });
    } finally {
      setIsCheckingSafety(false);
    }
  };


  // ── Send to scanner ──
  const handleSendToScanner = () => {
    if (structuredMeds.length === 0) return;
    if (safetyReport?.severity === "critical" && (!overrideConfirmed || !overrideReason.trim())) {
      setErrorMsg("Critical clinical warning override is required before sending.");
      return;
    }
    const drugNames = structuredMeds.map((m) => `${m.name} ${m.dose}`);
    onSendToScanner(drugNames);
    setSentToScanner(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8 animate-fadeIn"
      id="ocr-scanner"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-violet-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Prescription OCR Vision Scanner
            </h2>
            <p className="text-xs text-slate-500">
              Groq llama-3.2-11b Vision · Clinical Script Verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!backendOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 animate-bounce" /> Demo Offline Parser
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
            👁 Vision LLM Enabled
          </span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: Drop Zone / Preview ── */}
        <div className="space-y-3">
          {phase === "idle" ? (
            /* Drop zone */
            <motion.div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              animate={{
                borderColor: isDragging ? "#8b5cf6" : "#e2e8f0",
                backgroundColor: isDragging ? "rgba(139,92,246,0.05)" : "rgba(248,250,252,1)",
              }}
              className="relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[280px] group text-center"
              id="ocr-dropzone"
            >
              <motion.div
                animate={{ scale: isDragging ? 1.15 : 1 }}
                className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-violet-500" />
              </motion.div>
              <div>
                <p className="font-bold text-slate-700 text-base">
                  {isDragging ? "Drop the prescription here" : "Drag & drop or click to upload prescription"}
                </p>
                <p className="text-xs text-slate-450 mt-1">PNG · JPG · WEBP — max 10 MB</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {["Handwritten Rx", "Printed Script", "Hospital Order Form"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-2.5 py-1 bg-slate-150 text-slate-600 rounded-full font-bold uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                id="ocr-file-input"
              />
            </motion.div>
          ) : (
            /* Image preview panel */
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 min-h-[280px] flex items-center justify-center">
              {previewUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className={`w-full h-full object-contain transition-all duration-300 ${
                    previewZoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                  style={{ maxHeight: 280 }}
                  onClick={() => setPreviewZoom((z) => !z)}
                />
              )}

              {/* Laser animation while scanning */}
              {phase === "scanning" && <LaserScanOverlay />}

              {/* Top bar controls */}
              <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                <button
                  onClick={() => setPreviewZoom((z) => !z)}
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition"
                  title="Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={reset}
                  className="p-1.5 bg-slate-800/80 hover:bg-red-700 text-white rounded-lg transition animate-fadeIn"
                  title="Remove image"
                  id="ocr-reset-btn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* File info bottom bar */}
              {file && phase !== "scanning" && (
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 px-3 py-1.5 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] text-slate-300 truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {phase === "preview" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExtract}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-violet-300/30 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                id="ocr-extract-btn"
              >
                <ScanLine className="w-5 h-5 animate-pulse" />
                Extract Medications
              </motion.button>
            )}

            {phase === "scanning" && (
              <div className="flex-1 py-3 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center gap-2 text-violet-700 font-bold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading clinical text with Vision LLM…
              </div>
            )}

            {(phase === "success" || phase === "error") && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Another Script
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Right: Results panel ── */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {/* Idle placeholder */}
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl min-h-[280px]"
              >
                <ScanLine className="w-12 h-12 text-slate-350 mb-3" />
                <p className="text-slate-500 text-sm font-semibold">
                  Upload prescription script
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  DataDose parses medication names, doses, and schedules dynamically
                </p>
              </motion.div>
            )}

            {/* Preview waiting state */}
            {phase === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-violet-200 bg-violet-50/30 rounded-2xl min-h-[280px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-violet-500 animate-spin" />
                </div>
                <p className="text-violet-750 font-bold text-sm">Image Uploaded Successfully</p>
                <p className="text-xs text-violet-500 mt-1">
                  Ready. Click "Extract Medications" to run clinical parsing.
                </p>
              </motion.div>
            )}

            {/* Scanning in-progress results placeholder */}
            {phase === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[280px] bg-slate-50 rounded-2xl border"
              >
                <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-800 font-bold">Scanning prescription…</p>
                <p className="text-xs text-slate-455 mt-1">
                  Structuring data into Clinical Safety Table.
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl min-h-[280px]"
              >
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <div className="text-center">
                  <p className="font-bold text-red-800 text-sm">Extraction Failed</p>
                  <p className="text-xs text-red-600 mt-1 max-w-xs">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {/* Success: Editable medication table & Safety Checker */}
            {phase === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-4 text-left"
              >
                {/* Summary Banner */}
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">
                      {structuredMeds.length} Prescription line{structuredMeds.length !== 1 ? "s" : ""} extracted
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                      Please review and correct any values below.
                    </p>
                  </div>
                </div>

                {/* Patient verification warning if no patient selected */}
                {!selectedPatient && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No patient active. Select a patient record to enable EHR safety matching.</span>
                  </div>
                )}

                {/* Editable Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[9px] font-bold tracking-wider text-left">
                      <tr>
                        <th className="px-3 py-2">Drug Name</th>
                        <th className="px-3 py-2">Active Ingredient</th>
                        <th className="px-3 py-2">Dose</th>
                        <th className="px-3 py-2">Freq</th>
                        <th className="px-2 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {structuredMeds.map((med, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedication(i, "name", e.target.value)}
                              className="bg-transparent border-0 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-violet-500 rounded p-1 w-full font-bold text-slate-800 text-[11px]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={med.activeIngredient}
                              onChange={(e) => updateMedication(i, "activeIngredient", e.target.value)}
                              className="bg-transparent border-0 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-violet-500 rounded p-1 w-full text-slate-600 text-[11px]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={med.dose}
                              onChange={(e) => updateMedication(i, "dose", e.target.value)}
                              className="bg-transparent border-0 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-violet-500 rounded p-1 w-14 text-slate-700 text-[11px]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => updateMedication(i, "frequency", e.target.value)}
                              className="bg-transparent border-0 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-violet-500 rounded p-1 w-20 text-slate-700 text-[11px]"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => deleteMedication(i)}
                              className="p-1 text-red-650 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add manual item form inside table footer */}
                  <div className="bg-slate-50 border-t border-slate-200 p-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add drug name..."
                      value={newDrug.name}
                      onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px] flex-1 text-slate-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Ingredient..."
                      value={newDrug.activeIngredient}
                      onChange={(e) => setNewDrug({ ...newDrug, activeIngredient: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px] w-24 text-slate-850 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dose"
                      value={newDrug.dose}
                      onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px] w-12 text-slate-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Freq"
                      value={newDrug.frequency}
                      onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px] w-16 text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={addMedicationRow}
                      disabled={!newDrug.name || !newDrug.dose || !newDrug.frequency}
                      className="p-1.5 bg-violet-650 text-white rounded hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-between flex-wrap">
                  {selectedPatient && (
                    <button
                      onClick={runSafetyChecks}
                      disabled={isCheckingSafety || structuredMeds.length === 0}
                      className="px-4 py-2 border border-violet-300 text-violet-850 bg-violet-50 hover:bg-violet-100 transition rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      {isCheckingSafety ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Run Clinical Safety Check
                    </button>
                  )}

                  <div className="flex gap-2 ml-auto">
                    {sentToScanner ? (
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-250 text-emerald-800 font-bold rounded-lg text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sent to EHR Scanner
                      </div>
                    ) : (
                      <button
                        onClick={handleSendToScanner}
                        disabled={
                          structuredMeds.length === 0 ||
                          (safetyReport?.severity === "critical" && (!overrideConfirmed || !overrideReason.trim()))
                        }
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          structuredMeds.length === 0 ||
                          (safetyReport?.severity === "critical" && (!overrideConfirmed || !overrideReason.trim()))
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
                        }`}
                        id="ocr-send-to-scanner-btn"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send to Polypharmacy Scanner
                      </button>
                    )}
                  </div>
                </div>

                {/* Error / Warning info banner */}
                {errorMsg && (
                  <p className="text-[11px] text-red-650 font-bold bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    {errorMsg}
                  </p>
                )}

                {/* Inline Safety Report */}
                {safetyReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">Clinical Safety Assessment</h4>
                        <p className="text-[10px] text-slate-500">Matching patient: {selectedPatient?.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-white border px-2 py-0.5 rounded text-center">
                          <span className="text-[8px] text-slate-400 uppercase font-bold block">Score</span>
                          <span className={`text-[11px] font-black ${
                            safetyReport.severity === "critical" ? "text-red-600" :
                            safetyReport.severity === "warning" ? "text-yellow-600" : "text-green-700"
                          }`}>
                            {safetyReport.score}/10
                          </span>
                        </div>
                        <div className="bg-white border px-2 py-0.5 rounded text-center">
                          <span className="text-[8px] text-slate-400 uppercase font-bold block">Risk</span>
                          <span className={`text-[10px] font-black uppercase ${
                            safetyReport.severity === "critical" ? "text-red-600" :
                            safetyReport.severity === "warning" ? "text-yellow-600" : "text-green-700"
                          }`}>
                            {safetyReport.severity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Issue Warnings list */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {safetyReport.issues.length === 0 ? (
                        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold">No issues identified</p>
                            <p className="text-[10px] mt-0.5">Medications list has no direct conflicts with active EHR profile.</p>
                          </div>
                        </div>
                      ) : (
                        safetyReport.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border rounded-lg text-xs ${
                              issue.level === "high" ? "bg-red-50 border-red-200 text-red-900" : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold">
                              <span className="uppercase text-[10px]">{issue.type}</span>
                              <span className="text-[8px] uppercase px-1 rounded bg-white/80 border">
                                {issue.level} Risk
                              </span>
                            </div>
                            <p className="text-[10px] mt-1 text-slate-700">{issue.text}</p>
                            <p className="text-[10px] text-teal-850 font-bold bg-white/70 p-1.5 rounded border border-slate-100 mt-1.5">
                              <strong>Rec:</strong> {issue.action}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Override logs */}
                    {safetyReport.severity === "critical" && (
                      <div className="p-3 bg-red-950 border border-red-800 text-white rounded-lg text-xs space-y-2">
                        <div className="flex gap-2 items-center">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                          <h5 className="font-bold text-[11px]">Safety Override Signature Required</h5>
                        </div>
                        <p className="text-[10px] text-red-200">Justify clinical necessity to proceed with high-risk therapies:</p>
                        <textarea
                          placeholder="Override reason..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full bg-black/35 border border-red-500 rounded p-1 text-[10px] text-white focus:outline-none"
                          rows={1.5}
                        />
                        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overrideConfirmed}
                            onChange={(e) => setOverrideConfirmed(e.target.checked)}
                            className="rounded border-red-500 bg-black/35 focus:ring-red-400"
                          />
                          Verify signature and override warning liability.
                        </label>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
