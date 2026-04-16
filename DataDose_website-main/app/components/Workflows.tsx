"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Stethoscope,
  Building2,
  ShieldCheck,
  Target,
  ArrowRight
} from "lucide-react";

interface WorkflowStep {
  label: string;
}

interface RoleWorkflow {
  id: string;
  icon: React.ElementType;
  role: string;
  color: string;
  bgLight: string;
  borderColor: string;
  goal: string;
  steps: WorkflowStep[];
}

const workflows: RoleWorkflow[] = [
  {
    id: "physician",
    icon: Stethoscope,
    role: "Physician",
    color: "text-blue-600",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    goal: "Assist doctors in creating safer prescriptions without disrupting EMR workflow.",
    steps: [
      { label: "Search Patient Record" },
      { label: "Create Prescription" },
      { label: "AI Analyzes Cumulative Risk" },
      { label: "Review Danger Alerts" },
      { label: "Consult Symptom Detector" },
      { label: "Approve & E-Prescribe" },
    ],
  },
  {
    id: "pharmacist",
    icon: Pill,
    role: "Pharmacist",
    color: "text-teal-600",
    bgLight: "bg-teal-50",
    borderColor: "border-teal-200",
    goal: "Help pharmacists detect medication risks before dispensing over the counter.",
    steps: [
      { label: "Scan Paper Prescription (OCR)" },
      { label: "Digitize & Map to RxDB" },
      { label: "Drug Interaction Engine Runs" },
      { label: "Resolve Warning Flags" },
      { label: "Find Safe Alternatives" },
      { label: "Dispense Medication safely" },
    ],
  },
];

export default function Workflows() {
  const [activeTab, setActiveTab] = useState("physician");

  const activeWorkflow = workflows.find((w) => w.id === activeTab)!;

  return (
    <section id="workflows" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-teal-600 text-xs font-bold tracking-widest uppercase mb-3">
            Platform Roles
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Specialized Workflows
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            DataDose adapts perfectly to both clinical environments and pharmacy counters.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
              {workflows.map((wf) => {
                const Icon = wf.icon;
                const isActive = activeTab === wf.id;
                return (
                  <button
                    key={wf.id}
                    onClick={() => setActiveTab(wf.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? wf.color.split("-")[1] === "blue" ? "text-blue-600" : "text-teal-600" : ""}`} />
                    {wf.role} View
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`border ${activeWorkflow.borderColor} rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 bg-white`}
            >
              <div className={`${activeWorkflow.bgLight} p-6 md:px-10 flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0`}>
                  <activeWorkflow.icon className={`w-6 h-6 ${activeWorkflow.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{activeWorkflow.role} Workflow</h3>
                  <p className="text-sm text-slate-600 mt-1">{activeWorkflow.goal}</p>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-6 relative">
                  
                  {activeWorkflow.steps.map((step, i) => (
                    <div key={i} className="flex flex-col relative group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-full ${activeWorkflow.bgLight} ${activeWorkflow.borderColor} border-2 flex items-center justify-center text-sm font-bold ${activeWorkflow.color} shrink-0 shadow-sm`}>
                          {i + 1}
                        </div>
                        {i < activeWorkflow.steps.length - 1 && (
                          <div className="hidden md:block absolute top-5 left-12 right-[-2.5rem] h-0.5 bg-slate-100 group-last:hidden"></div>
                        )}
                        {/* Mobile line */}
                        {i < activeWorkflow.steps.length - 1 && (
                          <div className="md:hidden absolute top-10 left-5 bottom-[-2.5rem] w-0.5 bg-slate-100 group-last:hidden"></div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 pr-4">{step.label}</h4>
                    </div>
                  ))}

                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
