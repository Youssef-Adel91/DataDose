"use client";

import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15)_0,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1)_0,transparent_50%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Join 50+ Modern Healthcare Providers
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Ready to Eliminate <br/> Medication Errors?
          </h2>
          
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Integrate DataDose into your clinical workflow today. Protect your patients, reduce liability, and empower your physicians with world-class AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-teal-500/25 transition-all text-sm w-full sm:w-auto"
            >
              Get a Live Demo
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-8 py-4 rounded-xl transition-all text-sm w-full sm:w-auto hidden sm:flex"
            >
              Create Free Account <MoveRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
