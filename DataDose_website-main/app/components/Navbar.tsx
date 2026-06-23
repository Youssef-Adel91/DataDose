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
      className="w-full bg-transparent z-50 pt-6"
    >
      <nav className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <img src="/logo.svg" className="h-10 w-auto object-contain" alt="DataDose Logo" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <button className="text-sm font-semibold text-white bg-teal-700 px-5 py-2 rounded-lg shadow-sm hover:bg-teal-800 transition-colors">
                  Dashboard
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-2 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="text-sm font-semibold text-white bg-teal-700 px-6 py-2 rounded-lg shadow-sm hover:bg-teal-800 transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-600"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden mt-2 rounded-lg"
          >
            <div className="px-5 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-slate-600 hover:text-teal-700 py-2 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-slate-100 my-2" />
              {user ? (
                <>
                  <Link href="/dashboard">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-sm font-semibold text-white bg-teal-700 px-5 py-2.5 rounded-lg text-center"
                    >
                      Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 py-2 flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-sm font-semibold text-white bg-teal-700 px-5 py-2.5 rounded-lg text-center"
                  >
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
