"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "DataDose caught a severe Warfarin-Aspirin interaction that my EMR completely missed. It literally saved a patient's life last Tuesday.",
    author: "Dr. Sarah Al-Rashid",
    role: "ICU Attending Physician",
    hospital: "Riyadh Care Hospital",
    initials: "SA"
  },
  {
    quote: "The OCR scanner is incredibly accurate. It shaved 2 hours off our daily processing time, and the alternative drug suggestions are spot on.",
    author: "Ahmed Hassan, PharmD",
    role: "Lead Clinical Pharmacist",
    hospital: "CVS Regional Network",
    initials: "AH"
  },
  {
    quote: "Integrating the DataDose API into our hospital system took less than a week. The ROI in terms of reduced medical liability is immeasurable.",
    author: "James Wilson",
    role: "Chief Medical Information Officer",
    hospital: "St. Jude's Medical Center",
    initials: "JW"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white border-b border-slate-100 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-50/50 rounded-[100%] blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-teal-600 text-xs font-bold tracking-widest uppercase mb-3">Clinical Endorsements</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Trusted by Providers Worldwide
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            See how leading healthcare institutions are using DataDose to reduce medication errors.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((test, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow relative"
            >
              <div className="absolute top-8 right-8 text-teal-100">
                <Quote fill="currentColor" size={48} className="opacity-50" />
              </div>
              
              <div className="flex text-amber-400 mb-6 relative z-10">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} fill="currentColor" size={16} />
                ))}
              </div>

              <p className="text-slate-700 leading-relaxed italic mb-8 relative z-10 text-sm md:text-base">
                "{test.quote}"
              </p>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-teal-600 font-bold text-lg border border-slate-200 shrink-0">
                  {test.initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{test.author}</div>
                  <div className="text-xs font-medium text-slate-500">{test.role}</div>
                  <div className="text-[10px] uppercase font-bold text-teal-600 tracking-wider mt-0.5">{test.hospital}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
