"use client";


import Link from "next/link";

const footerLinks = {
  "Clinical Tools": [
    { label: "Drug Interaction Checker", href: "#features" },
    { label: "Prescription Scanner (OCR)", href: "#features" },
    { label: "Alternative Medications", href: "#features" },
    { label: "Risk Analysis", href: "#features" },
  ],
  "System": [
    { label: "How It Works", href: "#system-workflow" },
    { label: "Physician Workflow", href: "#workflows" },
    { label: "Pharmacist Workflow", href: "#workflows" },
    { label: "Patient Portal", href: "#workflows" },
  ],
  "Support": [
    { label: "Contact IT Support", href: "#" },
    { label: "System Documentation", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Use", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-3">
              <img src="/logo.svg" className="h-9 w-auto object-contain" alt="DataDose Logo" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed pr-4">
              Clinical Decision Support System for medication safety,
              prescription verification, and drug interaction detection.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-teal-700 transition-colors"
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
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} DataDose — Clinical Decision Support System.
            Not intended to replace professional medical judgment.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            System Operational
          </div>
        </div>
      </div>
    </footer>
  );
}
