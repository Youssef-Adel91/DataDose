"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, AlertTriangle, User, Search, FileText, CheckCircle2, Pill, Activity, Stethoscope } from "lucide-react";

const prescriptions = [
  { id: "RX-2431", patient: "Sarah Johnson", drug: "Amoxicillin 500mg", status: "safe", time: "2 min ago" },
  { id: "RX-2432", patient: "Michael Brown", drug: "Warfarin 5mg", status: "warning", time: "5 min ago" },
  { id: "RX-2433", patient: "Emily Davis", drug: "Metformin 850mg", status: "safe", time: "8 min ago" },
];

const patientData = [
  { label: "Name", value: "Sarah Johnson", alert: false },
  { label: "Age", value: "45 years (DOB: 03/12/1981)", alert: false },
  { label: "Allergies", value: "Penicillin, Sulfa", alert: true },
  { label: "Active Meds", value: "Aspirin 81mg, Lisinopril 10mg", alert: false },
];

export default function DashboardPreview() {
  const [activeView, setActiveView] = useState("physician");

  return (
    <section id="dashboard" className="py-24 section-alt border-y border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Enterprise SaaS UI</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            A Dashboard for Every Need
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Beautiful, purpose-built interfaces that adapt to your role.
          </p>
          
          <div className="flex justify-center mt-8">
            <div className="bg-slate-200/50 p-1 rounded-lg inline-flex">
              <button 
                onClick={() => setActiveView("physician")}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeView === "physician" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Physician View
              </button>
              <button 
                onClick={() => setActiveView("pharmacist")}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeView === "pharmacist" ? "bg-white shadow text-teal-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Pharmacist View
              </button>
            </div>
          </div>
        </div>

        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="dashboard-shadow rounded-2xl overflow-hidden bg-slate-50 border border-slate-200"
        >
          {/* Dashboard Header Shared */}
          <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeView === "physician" ? "bg-blue-600" : "bg-teal-600"}`}>
                <Pill className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">Data Dose</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeView === "physician" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                {activeView === "physician" ? "Physician Workspace" : "Pharmacist Terminal"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-44 h-8 bg-slate-50 rounded-lg border border-slate-200 pl-8 text-xs text-slate-400 flex items-center relative hidden sm:flex">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
                Search patients...
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeView === "physician" ? (
                /* Physician View */
                <motion.div key="phy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800">Create Prescription</h3>
                      </div>
                      <div className="space-y-4">
                        <input type="text" value="Warfarin 5mg" readOnly className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-700 font-medium" />
                        <div className="flex justify-between items-center bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                          <span className="text-sm text-slate-600 font-medium">+ Add Directions: "Take 1 tablet daily"</span>
                          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold">Sign & Order</button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 bg-red-500 h-full" />
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-700 text-sm">Critical Warning: Warfarin + Aspirin</h4>
                          <p className="text-xs text-red-600/80 mt-1 leading-relaxed">Major bleeding risk. The patient is already actively taking Aspirin 81mg. Concurrent use is severely contraindicated.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="font-bold text-slate-800 text-sm mb-3">Active Patient Record</h3>
                      <div className="space-y-3">
                        {patientData.map((d, i) => (
                          <div key={i} className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{d.label}</span>
                            <span className={`text-sm font-medium ${d.alert ? 'text-red-600' : 'text-slate-700'}`}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Pharmacist View */
                <motion.div key="pha" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScanLine className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-bold text-slate-800">OCR Scan Queue</span>
                      </div>
                      <button className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-md text-xs font-bold">Scan New Rx</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                            <th className="px-5 py-3 font-semibold">Rx ID</th>
                            <th className="px-5 py-3 font-semibold">Patient</th>
                            <th className="px-5 py-3 font-semibold">Medication</th>
                            <th className="px-5 py-3 font-semibold">Interaction Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptions.map((rx) => (
                            <tr key={rx.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                              <td className="px-5 py-3 font-mono text-xs text-slate-500">{rx.id}</td>
                              <td className="px-5 py-3 font-medium text-slate-700">{rx.patient}</td>
                              <td className="px-5 py-3 text-slate-600">{rx.drug}</td>
                              <td className="px-5 py-3">
                                {rx.status === "safe" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> CLEAR TO DISPENSE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3" /> CLINICAL REVIEW REQ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
