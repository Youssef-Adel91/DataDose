"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Pill,
  FlaskConical,
  Activity,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex flex-col lg:flex-row items-start justify-between gap-16 pt-12 pb-16 w-full max-w-6xl mx-auto px-6 z-10">
      {/* Left: System Description */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 max-w-lg"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5" />
          Clinical Decision Support System
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
          Medication Safety
          <br />
          <span className="text-teal-700">Starts Here</span>
        </h1>

        <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-md">
          DataDose helps physicians and pharmacists verify prescriptions,
          detect drug interactions, analyze active ingredients,
          and ensure patient medication safety.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-teal-700 text-white font-semibold px-7 py-3 rounded-lg shadow-sm hover:bg-teal-800 transition-colors text-sm flex items-center gap-2"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <a href="#system-workflow">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white text-slate-700 font-semibold px-7 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              View System Workflow
            </motion.button>
          </a>
        </div>

        {/* System Capabilities */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          {[
            { icon: <Pill className="w-4 h-4" />, label: "Drug Interaction Detection" },
            { icon: <FlaskConical className="w-4 h-4" />, label: "Active Ingredient Analysis" },
            { icon: <AlertTriangle className="w-4 h-4" />, label: "Prescription Risk Alerts" },
            { icon: <Activity className="w-4 h-4" />, label: "Patient Safety Monitoring" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 text-xs font-medium text-slate-600"
            >
              <div className="text-teal-600">{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right: Live Product Preview — Interaction Check Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-xs font-semibold text-slate-600">
              Medication Interaction Check
            </span>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Drug inputs */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">Warfarin</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                  +
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-slate-700">Aspirin</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Result */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-800">
                  Warning: Interaction Detected
                </span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed mb-3">
                Concurrent use of Warfarin and Aspirin significantly increases
                the risk of gastrointestinal and intracranial bleeding.
              </p>
              <div className="bg-white border border-red-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-700 mb-1">Recommendation</p>
                <p className="text-xs text-slate-600">
                  Consider alternative antiplatelet therapy. If combination is necessary,
                  monitor INR closely and assess bleeding risk.
                </p>
              </div>
            </div>

            {/* Safe example */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-800">
                  Metformin + Lisinopril — Safe
                </p>
                <p className="text-xs text-green-700">
                  No known clinically significant interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
