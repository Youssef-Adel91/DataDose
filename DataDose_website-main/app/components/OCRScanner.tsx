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
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OCRScannerProps {
  /**
   * Called once the user clicks "Send to Polypharmacy Scanner".
   * Pass the extracted array directly into <PolypharmacyScan injectDrugs={…} />
   */
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

export default function OCRScanner({ onSendToScanner }: OCRScannerProps) {
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

  return <OCRScannerUI onSendToScanner={onSendToScanner} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner scanner UI (only for authorised roles)
// ─────────────────────────────────────────────────────────────────────────────

function OCRScannerUI({ onSendToScanner }: OCRScannerProps) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [medications, setMedications] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sentToScanner, setSentToScanner] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setMedications([]);
    setErrorMsg("");
    setSentToScanner(false);
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
    setMedications([]);
    setErrorMsg("");
    setSentToScanner(false);
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

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "OCR failed.");
      }

      const meds: string[] = Array.isArray(data.medications) ? data.medications : [];
      setMedications(meds);
      setPhase(meds.length > 0 ? "success" : "error");
      if (meds.length === 0) {
        setErrorMsg(
          "No medications were detected in this image. Try a clearer, higher-resolution photo of the prescription."
        );
      }
    } catch (err: any) {
      setPhase("error");
      setErrorMsg(err.message ?? "Extraction failed. Please retry.");
    }
  };

  // ── Send to scanner ──
  const handleSendToScanner = () => {
    if (medications.length === 0) return;
    onSendToScanner(medications);
    setSentToScanner(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card-strong rounded-2xl p-8"
      id="ocr-scanner"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              AI Prescription Scanner
            </h2>
            <p className="text-sm text-slate-500">
              Vision LLM · Groq llama-3.2-11b · Feature 7 · Auto-populate Scanner
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!backendOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Backend Offline
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
            👁 OCR Enabled
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
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              animate={{
                borderColor: isDragging ? "#8b5cf6" : "#e2e8f0",
                backgroundColor: isDragging ? "rgba(139,92,246,0.05)" : "rgba(248,250,252,1)",
              }}
              className="relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[280px] group"
              id="ocr-dropzone"
            >
              <motion.div
                animate={{ scale: isDragging ? 1.15 : 1 }}
                className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-violet-500" />
              </motion.div>
              <div className="text-center">
                <p className="font-bold text-slate-700 text-base">
                  {isDragging ? "Drop the prescription here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  PNG · JPG · WEBP — max 10 MB
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {["Handwritten Rx", "Printed Script", "Hospital Form"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full font-medium"
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
                  className={`w-full h-full object-contain transition-all duration-300 ${previewZoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
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
                  className="p-1.5 bg-slate-800/80 hover:bg-red-700 text-white rounded-lg transition"
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
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-violet-300/30 transition flex items-center justify-center gap-2"
                id="ocr-extract-btn"
              >
                <ScanLine className="w-5 h-5" />
                Extract Medications
              </motion.button>
            )}

            {phase === "scanning" && (
              <div className="flex-1 py-3 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center gap-2 text-violet-700 font-bold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI Vision Scanning…
              </div>
            )}

            {(phase === "success" || phase === "error") && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Another
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
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl min-h-[280px]"
              >
                <ScanLine className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm font-medium">
                  Upload a prescription image to begin AI extraction
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Supports handwritten & printed prescriptions
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
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-violet-200 bg-violet-50/50 rounded-2xl min-h-[280px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-violet-500" />
                </div>
                <p className="text-violet-700 font-bold text-sm">
                  Ready to scan!
                </p>
                <p className="text-xs text-violet-500 mt-1">
                  Click "Extract Medications" to start AI Vision analysis
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
                className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[280px]"
              >
                <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-700 font-bold">Analysing prescription…</p>
                <p className="text-xs text-slate-400 mt-1">
                  Vision LLM is reading medication names
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
                <AlertTriangle className="w-10 h-10 text-red-400" />
                <div className="text-center">
                  <p className="font-bold text-red-700">Extraction Failed</p>
                  <p className="text-xs text-red-500 mt-1 max-w-xs">{errorMsg}</p>
                </div>
              </motion.div>
            )}

            {/* Success: medication chips */}
            {phase === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-4"
              >
                {/* Summary banner */}
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      {medications.length} medication{medications.length !== 1 ? "s" : ""} extracted
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      Vision LLM · Ready to send to N-Degree Scanner
                    </p>
                  </div>
                </div>

                {/* Drug chips */}
                <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200 rounded-xl min-h-[80px]">
                  {medications.map((med, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-sm font-semibold"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      {med}
                    </motion.span>
                  ))}
                </div>

                {/* Send to Scanner CTA */}
                <AnimatePresence mode="wait">
                  {sentToScanner ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Sent to N-Degree Scanner ✓
                    </motion.div>
                  ) : (
                    <motion.button
                      key="send-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendToScanner}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-300/30 transition flex items-center justify-center gap-2"
                      id="ocr-send-to-scanner-btn"
                    >
                      <Send className="w-5 h-5" />
                      Send to Polypharmacy Scanner
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Warning if some drugs may not be in graph */}
                <p className="text-[10px] text-slate-400 text-center italic">
                  Drug names are extracted as-is from the image. Verify spelling before scanning.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
