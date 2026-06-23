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
  Sparkles,
} from "lucide-react";

export default function Hero() {
  const cards = [
    {
      icon: Pill,
      title: "Drug Interaction",
      desc: "Identify harmful medication conflicts.",
    },
    {
      icon: FlaskConical,
      title: "Active Ingredient",
      desc: "Verify ingredients accurately.",
    },
    {
      icon: AlertTriangle,
      title: "Risk Alerts",
      desc: "Real-time high-risk warnings.",
    },
    {
      icon: Activity,
      title: "Safety Monitoring",
      desc: "Continuous patient protection.",
    },
  ];

  return (
    <section className="relative flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16 pt-16 lg:pt-24 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
      {/* Left: System Description & Product Cards */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 w-full max-w-xl text-left"
      >
        {/* Premium Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan-bg border border-brand-teal/20 text-brand-teal text-xs font-bold mb-6 select-none">
          <Shield className="w-3.5 h-3.5 fill-brand-teal/10" />
          Clinical Decision Support System
        </div>

        {/* Big Title with Gradient and Accent Underline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy leading-tight tracking-tight mb-3">
          Medication Safety
          <br />
          <span className="bg-gradient-to-r from-brand-teal to-teal-500 bg-clip-text text-transparent">
            Starts Here
          </span>
          <span className="text-brand-teal">.</span>
        </h1>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-20 bg-gradient-to-r from-brand-teal to-teal-400 rounded-full mb-6" />

        {/* Readable Description */}
        <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
          DataDose helps physicians and pharmacists verify prescriptions,
          detect drug interactions, analyze active ingredients,
          and ensure patient medication safety.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
          <Link href="/login" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-brand-teal to-teal-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-brand-teal/20 hover:shadow-brand-teal/30 hover:brightness-105 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <a href="#system-workflow" className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/60 hover:bg-white/90 text-slate-700 font-bold px-8 py-4 rounded-xl border border-slate-200/80 backdrop-blur-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer shadow-sm hover:shadow-md"
            >
              View System Workflow
            </motion.button>
          </a>
        </div>

        {/* 2x2 Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-brand-cyan-bg/50 hover:bg-brand-cyan-bg/85 border border-brand-teal/10 rounded-2xl p-4 md:p-5 flex flex-col items-start gap-3 backdrop-blur-sm transition-all duration-300 group shadow-[0_4px_12px_-4px_rgba(0,137,123,0.03)]"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0 group-hover:bg-brand-teal group-hover:text-white transition-all duration-300">
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-brand-navy mb-1 group-hover:text-brand-teal transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Right: Live Clinical Decision Support Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 w-full max-w-md lg:max-w-lg mt-8 lg:mt-0 relative"
      >
        {/* Glow effect under preview card */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal/20 to-teal-500/10 rounded-2xl blur-2xl z-0 pointer-events-none" />

        <div className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-10 transition-all duration-300 hover:shadow-2xl">
          {/* Header bar */}
          <div className="bg-brand-navy px-5 py-4 flex items-center justify-between border-b border-brand-navy/10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                DDI Engine Active
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Drug inputs */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-50/80 border border-slate-200/85 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Warfarin</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                    Anticoagulant
                  </span>
                </div>
              </div>

              <div className="flex justify-center my-1 relative">
                <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-dashed bg-slate-200" />
                <div className="w-7 h-7 rounded-full bg-white border-2 border-brand-teal/20 flex items-center justify-center text-brand-teal text-xs font-black shadow-sm z-10">
                  +
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-50/80 border border-slate-200/85 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Aspirin</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    NSAID
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Result */}
            <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs md:text-sm font-bold text-red-800 uppercase tracking-wide">
                  Severe Interaction Detected
                </span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed mb-3">
                Concurrent use of Warfarin and Aspirin significantly increases
                the risk of gastrointestinal and intracranial bleeding.
              </p>
              <div className="bg-white/90 border border-red-100/80 rounded-lg p-3 shadow-[0_2px_8px_rgba(239,68,68,0.03)]">
                <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Recommendation
                </p>
                <p className="text-xs text-slate-600 leading-normal">
                  Consider alternative antiplatelet therapy. If combination is necessary,
                  monitor INR closely and assess bleeding risk.
                </p>
              </div>
            </div>

            {/* Safe example */}
            <div className="bg-green-50/80 border border-green-200/60 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-800">
                  Metformin + Lisinopril
                </p>
                <p className="text-[11px] text-green-700">
                  Safe: No clinically significant interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
