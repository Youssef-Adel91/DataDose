"use client";

import { CheckCircle2, Shield, Activity, Building, Globe } from "lucide-react";
import { motion } from "framer-motion";

const trustItems = [
  { icon: Shield, label: "HIPAA Compliant" },
  { icon: Activity, label: "HL7 FHIR Ready" },
  { icon: CheckCircle2, label: "99.9% Uptime" },
  { icon: Building, label: "FDA Aligned" },
  { icon: Globe, label: "Trusted by 50+ Hospitals" },
];

export default function TrustStrip() {
  return (
    <section className="bg-slate-50 border-y border-slate-100 py-6 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {trustItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-2 text-slate-500"
              >
                <Icon className="w-4 h-4 text-teal-600 opacity-80" />
                <span className="text-sm font-semibold tracking-wide text-slate-600">
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
