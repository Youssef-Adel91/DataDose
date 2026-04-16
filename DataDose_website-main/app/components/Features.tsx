"use client";

import { motion } from "framer-motion";
import {
  Network,
  RefreshCw,
  Activity,
  GitBranch,
  Bot,
  ScanLine,
} from "lucide-react";

const features = [
  {
    icon: Network,
    title: "N-Degree Polypharmacy Scanner",
    badge: "Feature 1",
    badgeColor: "bg-red-100 text-red-700",
    description:
      "Enter up to 10 medications. Our Neo4j Knowledge Graph performs N-degree interaction scanning across 3,656 active ingredients to detect all Fatal, Severe, and Major DDIs simultaneously.",
    color: "from-teal-500 to-teal-600",
    bgLight: "bg-teal-50",
    borderHover: "hover:border-teal-300",
    href: "#polypharmacy-scan",
  },
  {
    icon: RefreshCw,
    title: "Smart Safe Alternatives",
    badge: "Feature 2",
    badgeColor: "bg-orange-100 text-orange-700",
    description:
      "Provide the drug to replace, the disease to treat, and the symptom to avoid. Our engine cross-checks your current medications for DDI and returns the safest therapeutic alternative.",
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    borderHover: "hover:border-emerald-300",
    href: "#smart-alternatives",
  },
  {
    icon: Activity,
    title: "Reverse Symptom Tracer",
    badge: "Feature 3",
    badgeColor: "bg-indigo-100 text-indigo-700",
    description:
      "Input an unexpected symptom (e.g., Respiratory Depression, Hyperkalemia). DataDose performs a reverse graph traversal to identify the suspect drug, its mechanism, and the emergency action.",
    color: "from-indigo-500 to-indigo-600",
    bgLight: "bg-indigo-50",
    borderHover: "hover:border-indigo-300",
    href: "#symptom-tracer",
  },
  {
    icon: GitBranch,
    title: "Prescription Visual Map",
    badge: "Feature 4",
    badgeColor: "bg-cyan-100 text-cyan-700",
    description:
      "An interactive React Flow graph renders your full prescription as a network. Red lines = Fatal/Severe DDI. Orange lines = Major DDI. Green = Safe. Zoom, pan, and click any node for details.",
    color: "from-cyan-500 to-cyan-600",
    bgLight: "bg-cyan-50",
    borderHover: "hover:border-cyan-300",
    href: "#visual-map",
  },
  {
    icon: ScanLine,
    title: "OCR Prescription Scanner",
    badge: "Feature 5a",
    badgeColor: "bg-purple-100 text-purple-700",
    description:
      "Upload a photo of a handwritten or printed prescription. Our OCR engine digitizes medication names, dosages, and frequencies with 99.8% medical-term accuracy before DDI analysis.",
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
    borderHover: "hover:border-purple-300",
    href: "#ocr-scanner",
  },
  {
    icon: Bot,
    title: "GraphRAG AI Chatbot",
    badge: "Feature 5b",
    badgeColor: "bg-slate-100 text-slate-700",
    description:
      "Ask clinical questions in natural language. Every answer is grounded in the Knowledge Graph — not hallucinated. Responses are tagged as ⚡ Deterministic (graph rule) or 🤖 AI Augmented.",
    color: "from-slate-500 to-slate-600",
    bgLight: "bg-slate-50",
    borderHover: "hover:border-slate-300",
    href: "#graphrag-chatbot",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-teal-600 text-xs font-bold tracking-widest uppercase mb-3"
          >
            Capabilities
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
          >
            5 Killer Features for Zero Medication Errors
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg leading-relaxed"
          >
            Every feature is powered by a Neo4j Knowledge Graph with 3,656 active ingredients and deterministic DDI rules — guaranteeing{" "}
            <span className="font-bold text-teal-600">0% hallucination</span> on critical safety data.
          </motion.p>
        </div>

        {/* Traffic Light Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12 p-4 bg-slate-50 rounded-2xl border border-slate-100"
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Traffic Light System:</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-3 h-3 rounded-full bg-zinc-900 inline-block" />⬛ Fatal</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />🔴 Severe</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />🟠 Major</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />🟡 Minor</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />🟢 Safe</span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group ${feature.borderHover}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <a
                  href={feature.href}
                  className="text-teal-600 text-xs font-bold uppercase tracking-wider group-hover:underline inline-flex items-center gap-1"
                >
                  See it in action <span className="text-lg leading-none">&rsaquo;</span>
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
