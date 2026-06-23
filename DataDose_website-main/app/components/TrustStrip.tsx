"use client";

import { Pill, FlaskConical, AlertTriangle, FileSearch, Shield } from "lucide-react";
import { motion } from "framer-motion";

const capabilities = [
  { icon: FlaskConical, label: "Active Ingredient Analysis" },
  { icon: AlertTriangle, label: "Drug Interaction Detection" },
  { icon: FileSearch, label: "Prescription Safety Verification" },
  { icon: Shield, label: "Patient Risk Assessment" },
  { icon: Pill, label: "Alternative Medication Suggestions" },
];

export default function TrustStrip() {
  return (
    <section className="bg-white border-y border-slate-100 py-5 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:gap-x-10">
          {capabilities.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-2 text-slate-500"
              >
                <Icon className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold tracking-wide text-slate-600">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
