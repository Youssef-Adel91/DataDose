"use client";

import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10 w-full">
        {/* Left: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Problem Statement Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold mb-6 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            7,000+ DEATHS/YEAR FROM MEDICATION ERRORS
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Smart Clinical Decision Support for{" "}
            <span className="bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              Safer Prescriptions
            </span>
          </h1>

          {/* Value Proposition & AI Pill */}
          <div className="flex items-start gap-4 mb-8 max-w-xl">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-lg text-slate-500 leading-relaxed">
              Powered by a Knowledge Graph of <strong className="text-slate-800">3,656 active ingredients</strong>, DataDose delivers <strong className="text-teal-600">0% hallucination</strong> deterministic DDI analysis and safe alternatives before they reach the patient.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2 gradient-teal text-white font-semibold px-8 py-4 rounded-full shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all text-sm w-full sm:w-auto"
            >
              Get a Demo
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-4 rounded-full shadow-sm border border-slate-200 hover:border-teal-300 hover:text-teal-700 transition-all text-sm w-full sm:w-auto"
            >
              Start Free Trial
              <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </div>
        </motion.div>

        {/* Right: Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative lg:h-[500px] w-full flex items-center justify-center lg:justify-end"
        >
          {/* Main Mockup Card */}
          <div className="dashboard-shadow rounded-2xl overflow-hidden bg-white border border-slate-200 w-full max-w-lg relative z-20">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="text-[10px] font-medium text-slate-400 bg-white px-3 py-1 rounded-md shadow-sm border border-slate-100 flex-1 text-center">
                system.datadose.health / rx-analysis
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Patient Info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-slate-800">Sarah Johnson</div>
                  <div className="text-xs text-slate-500">ID: PT-88291 • Age 45 • F</div>
                </div>
                <div className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded text-[10px] font-bold">
                  Status: Review
                </div>
              </div>

              {/* Rx Input */}
              <div className="bg-slate-50 border-l-2 border-teal-500 rounded p-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-widest">Scanned Prescription</div>
                <div className="text-sm font-medium text-slate-700">1. Warfarin 5mg</div>
                <div className="text-sm font-medium text-slate-700">2. Aspirin 81mg</div>
              </div>

              {/* Alert Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="bg-red-50 border border-red-100 rounded-lg p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full blur-xl -mr-8 -mt-8" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-700">CRITICAL INTERACTION DETECTED</h4>
                    <p className="text-xs text-red-600 mt-1 leading-snug">
                      Warfarin + Aspirin significantly increases the risk of bleeding. Concurrent use is generally contraindicated without strict clinical monitoring.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Suggestion Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">AI Suggestion</div>
                  <div className="text-sm font-medium text-slate-800">Switch Aspirin to Clopidogrel?</div>
                </div>
                <button className="text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-colors">
                  Apply Fix
                </button>
              </motion.div>
            </div>
          </div>

          {/* Floating Elements (Background) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute -right-6 top-1/4 bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-30 hidden sm:flex items-center gap-3 animate-float"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Lab Results Synced</div>
              <div className="text-[10px] text-slate-500">Updated 2m ago</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
