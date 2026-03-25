"use client";

import { Pill, Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Knowledge Graph", href: "#knowledge-graph" },
    { label: "OCR Scanner", href: "#features" },
    { label: "Symptom Detector", href: "#features" },
    { label: "Clinical Analytics", href: "#analytics" }
  ],
  Resources: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Interactive Demo", href: "#interactive-demo" },
    { label: "Workflows", href: "#workflows" },
    { label: "Developer API", href: "#" }
  ],
  Company: [
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" }
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "HIPAA Compliance", href: "#" },
    { label: "Security", href: "#" }
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group cursor-pointer inline-flex">
              <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">
                Data Dose
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed pr-6 mb-6">
              The fastest, most accurate clinical decision support system. Eliminate medication errors and empower your healthcare team with real-time AI.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 text-slate-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 text-slate-400 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 text-slate-400 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-1">
              <h4 className="text-sm font-bold text-slate-800 mb-4 tracking-wide">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-medium">
            Copyright © {new Date().getFullYear()} Data Dose Inc. All rights reserved. Not intended to replace professional medical advice.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> System Status: All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
