"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Pill, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Company", href: "#company" },
  { label: "Support", href: "#support" },
  { label: "Legal", href: "#legal" },
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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full bg-transparent z-50 pt-8"
    >
      <nav className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            Data Dose
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-bold text-slate-600 hover:text-teal-600 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-sm font-semibold text-white gradient-teal px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Dashboard
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleLogout}
                className="text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="text-[13px] font-bold text-teal-900 bg-teal-50/80 px-6 py-2.5 rounded-full shadow-sm hover:bg-teal-100 transition-all duration-300">
                  Log in
                </button>
              </Link>
              <Link href="/login">
                <button className="text-[13px] font-bold text-white bg-[#0f172a] px-6 py-2.5 rounded-full shadow-lg hover:bg-slate-800 transition-all duration-300 ml-2">
                  Learn More
                </button>
              </Link>
            </>
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
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-slate-600 hover:text-teal-600 py-2 transition-colors"
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
                      className="w-full text-sm font-semibold text-white gradient-teal px-5 py-2.5 rounded-full text-center shadow-md"
                    >
                      Dashboard
                    </button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 py-2 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-semibold text-slate-700 py-2 w-full text-left"
                    >
                      Log In
                    </button>
                  </Link>
                  <Link href="/login">
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-sm font-semibold text-white gradient-teal px-5 py-2.5 rounded-full text-center shadow-md"
                    >
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
