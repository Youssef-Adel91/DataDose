"use client";

import { motion } from "framer-motion";
import { FileScan, Cpu, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: FileScan,
    number: "01",
    title: "Upload Prescription",
    description: "Scan a handwritten rx or enter it directly from the EMR.",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: Cpu,
    number: "02",
    title: "AI Analyzes Interactions",
    description: "Our Knowledge Graph compares the new Rx against the patient's current meds and history.",
    color: "from-teal-400 to-teal-600"
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "Get Safe Alternatives",
    description: "If a danger is found, get instant, safe alternatives within the same class.",
    color: "from-emerald-400 to-emerald-600"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 section-alt border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            How Data Dose Works
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            A seamless three-step process to ensure 100% medication safety.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[88px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-slate-200 via-teal-200 to-slate-200 -z-10" />

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="flex flex-col items-center text-center relative"
                >
                  <div className="w-44 h-44 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center relative mb-8 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500 ease-out" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                    <Icon className="w-16 h-16 text-teal-600 group-hover:scale-110 transition-transform duration-500 ease-out" />
                    
                    <div className="absolute top-0 right-0 w-12 h-12 bg-slate-900 rounded-bl-3xl flex items-center justify-center text-white font-bold text-sm shadow-sm z-20">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-xs">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
