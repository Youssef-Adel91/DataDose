"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cpu } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex flex-col xl:flex-row items-center justify-between gap-12 pt-16 pb-12 w-full max-w-6xl mx-auto px-6 z-10">
      {/* Left: Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-[0.9] max-w-xl text-left"
      >
        <h1 className="text-[2.8rem] sm:text-[3.5rem] lg:text-[4rem] font-extrabold text-[#0f172a] leading-[1.05] tracking-tight mb-5">
          Smart Clinical <br className="hidden sm:block" /> Decision Support for <br className="hidden sm:block" />
          <span className="text-[#0f172a]">
            Safer Prescriptions
          </span>
        </h1>

        <div className="mb-8">
          <p className="text-[1.1rem] text-slate-500 font-medium leading-relaxed max-w-md">
            As a modern medical technology platform, smart clinical decision support (CDSS) for safer prescriptions.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#1e293b] text-white font-semibold px-8 py-3.5 rounded-full shadow-[0_8px_20px_rgb(30,41,59,0.3)] hover:bg-[#0f172a] transition-all text-[15px] tracking-wide"
            >
              Get a Demo
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-teal-50 text-teal-800 font-semibold px-8 py-3.5 rounded-full shadow-sm transition-all text-[15px] tracking-wide border border-teal-100 hover:bg-teal-100"
            >
              Learn More
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Right: Graphic Match for the Pill/Circuitry */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 flex justify-center items-center w-full relative h-[450px]"
      >
        {/* Aesthetic circuit background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <svg className="w-[120%] h-[120%] text-teal-600/30" viewBox="0 0 400 400" fill="none">
             <path d="M 50 200 L 150 200 L 150 100 L 350 100" stroke="currentColor" strokeWidth="1" />
             <path d="M 100 350 L 100 250 L 250 250 L 250 150" stroke="currentColor" strokeWidth="1" />
             <path d="M 0 50 L 200 50 L 200 300 L 400 300" stroke="currentColor" strokeWidth="1" />
             <circle cx="150" cy="100" r="3" fill="currentColor" />
             <circle cx="250" cy="150" r="3" fill="currentColor" />
             <circle cx="200" cy="300" r="3" fill="currentColor" />
             
             {/* Extra circuit lines to populate space */}
             <path d="M 80 80 L 120 80 L 120 180" stroke="currentColor" strokeWidth="1" />
             <circle cx="80" cy="80" r="3" fill="currentColor" />
             
             <path d="M 350 280 L 300 280 L 300 180" stroke="currentColor" strokeWidth="1" />
             <circle cx="350" cy="280" r="3" fill="currentColor" />
             
             <path d="M 180 350 L 180 320 L 280 320" stroke="currentColor" strokeWidth="1" />
             <circle cx="180" cy="350" r="3" fill="currentColor" />
             <circle cx="280" cy="320" r="3" fill="currentColor" />
             
             <path d="M 280 50 L 280 80 L 350 80" stroke="currentColor" strokeWidth="1" />
             <circle cx="280" cy="50" r="3" fill="currentColor" />
             
             {/* Minor dot clusters */}
             <circle cx="120" cy="280" r="2" fill="currentColor" />
             <circle cx="130" cy="290" r="2" fill="currentColor" />
             <circle cx="280" cy="120" r="2" fill="currentColor" />
             <circle cx="290" cy="130" r="2" fill="currentColor" />
           </svg>
        </div>

        {/* AI Chip indicators */}
        <div className="absolute top-12 right-12 bg-teal-600 shadow-xl border border-teal-400 rounded-lg p-2 text-white transform rotate-[10deg]">
           <Cpu className="w-6 h-6" />
           <span className="text-[10px] font-bold block text-center mt-0.5">AI</span>
        </div>
        <div className="absolute bottom-12 right-20 bg-teal-600 shadow-xl border border-teal-400 rounded-lg p-1.5 text-white transform -rotate-[5deg]">
           <Cpu className="w-5 h-5" />
           <span className="text-[8px] font-bold block text-center mt-0.5">AI</span>
        </div>
        <div className="absolute bottom-10 left-10 bg-teal-600 shadow-xl border border-teal-400 rounded-lg p-1.5 text-white transform rotate-[5deg]">
           <span className="text-[10px] font-bold block px-1 text-center">AI</span>
        </div>

        {/* The pills crossing */}
        <div className="relative w-80 h-80 flex justify-center items-center">
          <div className="absolute bg-gradient-to-br from-teal-400 to-teal-800 w-[70px] h-[240px] rounded-[35px] shadow-2xl rotate-[55deg] z-10 border border-teal-200" />
          <div className="absolute w-[70px] h-[240px] rounded-[35px] shadow-2xl -rotate-[35deg] z-20 flex flex-col overflow-hidden border-[3px] border-[#1e293b]">
            <div className="h-1/2 w-full bg-gradient-to-b from-teal-300 to-teal-500 flex items-center justify-center relative">
               <div className="w-full h-full opacity-40 flex flex-wrap gap-1 p-2">
                 {[...Array(15)].map((_,i) => <div key={i} className="w-2 h-2 rounded-full bg-white"/>)}
               </div>
            </div>
            <div className="h-1/2 w-full bg-white flex items-center justify-center relative">
               <div className="w-8 h-1 rounded-full bg-teal-200" />
               <div className="absolute top-2 w-full h-[1px] bg-slate-100" />
               <div className="absolute bottom-2 w-full h-[1px] bg-slate-100" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
