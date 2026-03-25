"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { BarChart3, Activity, ShieldCheck, Stethoscope } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function Counter({ value, formatContext = "" }: { value: number; formatContext?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const roundedValue = Math.round(latest);
    if (formatContext === "percentage") return `${(roundedValue / 10).toFixed(1)}%`;
    return roundedValue.toLocaleString();
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: "easeOut" });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

const stats = [
  { icon: BarChart3, label: "Prescriptions Analyzed", value: 124847, color: "text-teal-600", bg: "bg-teal-50" },
  { icon: ShieldCheck, label: "Errors Prevented", value: 9284, color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Activity, label: "Overall Safety Score", value: 985, isPercentage: true, color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Stethoscope, label: "Active Clinicians", value: 3621, color: "text-indigo-600", bg: "bg-indigo-50" },
];

const barData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    { label: "Prescriptions Scanned", data: [1200, 1900, 1500, 2200, 1800, 800, 500], backgroundColor: "#14b8a6", borderRadius: 4 },
    { label: "Alerts Triggered", data: [150, 230, 180, 310, 220, 90, 60], backgroundColor: "#f59e0b", borderRadius: 4 },
  ],
};

const doughnutData = {
  labels: ["Safe (Green)", "Warning (Yellow)", "Danger (Red)", "Critical (Purple)"],
  datasets: [{
    data: [82, 12, 4, 2],
    backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    borderWidth: 0,
    cutout: "70%",
  }],
};

export default function Analytics() {
  return (
    <section id="analytics" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-teal-600 text-xs font-bold tracking-widest uppercase mb-3">Proven Results</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Clinical Impact at Scale
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            DataDose actively monitors patient safety across thousands of clinical touchpoints continuously. 
          </p>
        </div>

        {/* Counter Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-extrabold text-slate-800 mb-1">
                  <Counter value={stat.value} formatContext={stat.isPercentage ? "percentage" : ""} />
                </div>
                <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-5 gap-6"
        >
          <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Daily Prescription Vol vs Alerts</h3>
            <div className="h-72">
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Risk Stratification Breakdown</h3>
            <div className="h-72 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col text-center mt-6">
                <span className="text-3xl font-bold text-emerald-500">82%</span>
                <span className="text-xs text-slate-400 font-semibold uppercase">Perfectly Safe</span>
              </div>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
