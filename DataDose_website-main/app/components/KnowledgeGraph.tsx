"use client";

import { motion } from "framer-motion";

// Helper for generating lines between nodes
function Edge({ x1, y1, x2, y2, color, delay }: { x1: number; y1: number; x2: number; y2: number; color: string; delay: number }) {
  return (
    <motion.path
      d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${y1 - 20} ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeDasharray="6,6"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.6 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5, delay, ease: "easeInOut" }}
    />
  );
}

// Helper for drug nodes
function Node({ x, y, label, color, type, delay }: { x: number; y: number; label: string; color: string; type: string; delay: number }) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay }}
      className="cursor-pointer group"
    >
      {/* Glow */}
      <circle cx={x} cy={y} r="25" fill={color} className="opacity-20 group-hover:opacity-40 transition-opacity" />
      {/* Node */}
      <circle cx={x} cy={y} r="12" fill={color} className="shadow-lg" />
      <circle cx={x} cy={y} r="14" fill="none" stroke={color} strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Tooltip Background */}
      <rect x={x - 40} y={y + 16} width="80" height="34" rx="4" fill="#0f172a" className="opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* Label */}
      <text x={x} y={y + 30} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
      </text>
      <text x={x} y={y + 42} textAnchor="middle" fill={color} fontSize="8" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {type}
      </text>
    </motion.g>
  );
}

export default function KnowledgeGraph() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden text-white section-alt" id="knowledge-graph">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1)_0,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-4"
          >
            THE WOW FEATURE
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
          >
            See Drug Interactions Like Never Before
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Our medical knowledge graph maps millions of molecular interactions in real-time, instantly flagging contraindications.
          </motion.p>
        </div>

        {/* The Graph Canvas */}
        <div className="w-full h-[400px] sm:h-[500px] border border-slate-800 rounded-2xl bg-slate-950/50 backdrop-blur-sm relative overflow-hidden flex items-center justify-center">
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs flex flex-col gap-2 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              <span className="text-slate-300 font-medium">Fatal/Severe Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              <span className="text-slate-300 font-medium">Major Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></span>
              <span className="text-slate-300 font-medium">Safe Node</span>
            </div>
          </div>

          <svg viewBox="0 0 800 400" className="w-full h-full min-w-[600px] absolute inset-0 m-auto">
            {/* Edges */}
            <Edge x1={400} y1={200} x2={250} y2={100} color="#f59e0b" delay={0.5} /> {/* Center to Top Left (Amber) */}
            <Edge x1={400} y1={200} x2={550} y2={100} color="#ef4444" delay={0.7} /> {/* Center to Top Right (Red) */}
            <Edge x1={400} y1={200} x2={200} y2={250} color="#14b8a6" delay={0.6} /> {/* Center to Left (Teal) */}
            <Edge x1={400} y1={200} x2={600} y2={250} color="#14b8a6" delay={0.8} /> {/* Center to Right (Teal) */}
            <Edge x1={400} y1={200} x2={400} y2={320} color="#f59e0b" delay={0.9} /> {/* Center to Bottom (Amber) */}
            
            <Edge x1={250} y1={100} x2={150} y2={120} color="#14b8a6" delay={1.0} />
            <Edge x1={550} y1={100} x2={650} y2={120} color="#ef4444" delay={1.1} />
            <Edge x1={650} y1={120} x2={720} y2={200} color="#14b8a6" delay={1.2} />
            <Edge x1={200} y1={250} x2={100} y2={220} color="#14b8a6" delay={1.1} />
            <Edge x1={400} y1={320} x2={300} y2={350} color="#14b8a6" delay={1.2} />
            <Edge x1={400} y1={320} x2={500} y2={350} color="#14b8a6" delay={1.3} />

            {/* Central Node */}
            <Node x={400} y={200} label="Warfarin" type="ANTICOAGULANT" color="#ef4444" delay={0.2} />
            
            {/* Primary Neighbors */}
            <Node x={250} y={100} label="Ibuprofen" type="NSAID" color="#f59e0b" delay={0.4} />
            <Node x={550} y={100} label="Aspirin" type="NSAID" color="#ef4444" delay={0.5} />
            <Node x={200} y={250} label="Lisinopril" type="ACE INHIBITOR" color="#14b8a6" delay={0.4} />
            <Node x={600} y={250} label="Metoprolol" type="BETA BLOCKER" color="#14b8a6" delay={0.6} />
            <Node x={400} y={320} label="Omeprazole" type="PPI" color="#f59e0b" delay={0.7} />

            {/* Secondary Neighbors */}
            <Node x={150} y={120} label="Naproxen" type="NSAID" color="#14b8a6" delay={0.8} />
            <Node x={650} y={120} label="Clopidogrel" type="ANTIPLATELET" color="#ef4444" delay={0.9} />
            <Node x={720} y={200} label="Ticagrelor" type="ANTIPLATELET" color="#14b8a6" delay={1.0} />
            <Node x={100} y={220} label="Amlodipine" type="CCB" color="#14b8a6" delay={0.9} />
            <Node x={300} y={350} label="Pantoprazole" type="PPI" color="#14b8a6" delay={1.0} />
            <Node x={500} y={350} label="Esomeprazole" type="PPI" color="#14b8a6" delay={1.1} />
          </svg>
        </div>
      </div>
    </section>
  );
}
