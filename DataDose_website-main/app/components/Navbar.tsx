"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Capabilities", href: "#features" },
  { label: "How It Works", href: "#system-workflow" },
  { label: "Roles", href: "#workflows" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="w-full flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <img src="/logo.svg" className="h-9 w-auto object-contain" alt="DataDose Logo" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-brand-teal transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button className="text-sm font-semibold text-white bg-brand-teal px-5 py-2 rounded-lg shadow-sm hover:bg-teal-700 active:scale-95 transition-all duration-200 cursor-pointer">
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="text-sm font-semibold text-white bg-brand-teal px-6 py-2 rounded-lg shadow-sm hover:bg-teal-700 active:scale-95 transition-all duration-200 cursor-pointer">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-brand-teal hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden border-t border-slate-100 overflow-hidden bg-white/95 backdrop-blur-md rounded-b-xl shadow-lg"
            >
              <div className="px-4 py-5 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-slate-600 hover:text-brand-teal py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="border-slate-100 my-1" />
                <div className="px-3 pt-2">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <Link href="/dashboard" className="w-full">
                        <button
                          onClick={() => setMobileOpen(false)}
                          className="w-full text-sm font-semibold text-white bg-brand-teal px-5 py-3 rounded-lg text-center shadow-md active:scale-[0.98] transition-transform"
                        >
                          Dashboard
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileOpen(false);
                        }}
                        className="text-sm font-semibold text-slate-500 hover:text-red-600 py-3 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link href="/login" className="w-full">
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-sm font-semibold text-white bg-gradient-to-r from-brand-teal to-teal-600 px-5 py-3 rounded-lg text-center shadow-md active:scale-[0.98] transition-transform"
                      >
                        Sign In
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
