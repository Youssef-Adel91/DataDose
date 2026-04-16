"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const tiers = [
  {
    name: "Independent Clinic",
    price: "$99",
    period: "/month",
    description: "Perfect for single practitioners and small pharmacies.",
    features: ["Up to 1,000 Rx scans/month", "Real-time Interaction Checker", "Basic Alternatives Engine", "Email Support"],
    popular: false,
    cta: "Start Free Trial",
    ctaClass: "bg-white text-slate-900 border border-slate-200 hover:border-teal-500",
  },
  {
    name: "Hospital Network",
    price: "$499",
    period: "/month",
    description: "For mid-to-large medical centers with multiple care units.",
    features: ["Unlimited Rx Scans", "Advanced Knowledge Graph", "Reverse Symptom Detector", "EMR/EHR Integrations", "Priority 24/7 Support"],
    popular: true,
    cta: "Upgrade to Hospital",
    ctaClass: "gradient-teal text-white shadow-lg shadow-teal-500/25 border-none",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "National pharmacy chains and massive health systems.",
    features: ["Dedicated Instance", "Custom Clinical Guidelines", "FHIR/HL7 Auto-sync", "Dedicated Account Manager", "SLA & 99.99% Uptime Guarantee"],
    popular: false,
    cta: "Contact Sales",
    ctaClass: "bg-slate-900 text-white hover:bg-slate-800 border-none",
  }
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
            Simple, Transparent Pricing
          </h2>
          
          <div className="inline-flex items-center gap-3 bg-white p-1 rounded-full border border-slate-200 shadow-sm mx-auto">
            <button 
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!annual ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${annual ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:text-slate-800"}`}
            >
              Annually (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 border ${tier.popular ? "border-teal-500 shadow-xl shadow-teal-500/10" : "border-slate-200 shadow-sm"}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{tier.name}</h3>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{tier.description}</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {tier.price !== "Custom" ? (annual ? `$${Math.round(parseInt(tier.price.replace('$','')) * 0.8)}` : tier.price) : tier.price}
                </span>
                {tier.period && <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300">{tier.period}</span>}
              </div>

              <button className={`w-full py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all mb-8 ${tier.ctaClass}`}>
                {tier.cta} <ChevronRight className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Included Features</p>
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
