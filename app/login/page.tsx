'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Redirect based on role (handled by middleware/layout)
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-teal rounded-full blur-xl opacity-50" />
              <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center">
                <Heart className="w-8 h-8 text-teal-600 fill-teal-600" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Dose</h1>
          <p className="text-slate-600 font-medium">Smart Clinical Decision Support System</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card-strong rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/50 border border-teal-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Demo: pharmacist@datadose.ai, physician@datadose.ai, admin@datadose.ai, superadmin@datadose.ai
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-teal-200 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Demo password: password123</p>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset functionality coming soon!');
                }}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-teal text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-500">Demo Credentials</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo Accounts */}
          <div className="space-y-2 text-xs">
            <div className="bg-gradient-teal-light/50 rounded p-2 border border-teal-200">
              <p className="font-medium text-teal-900">👨‍⚕️ Pharmacist</p>
              <p className="text-teal-700">pharmacist@datadose.ai</p>
            </div>
            <div className="bg-gradient-teal-light/50 rounded p-2 border border-teal-200">
              <p className="font-medium text-teal-900">🏥 Physician</p>
              <p className="text-teal-700">physician@datadose.ai</p>
            </div>
            <div className="bg-gradient-teal-light/50 rounded p-2 border border-teal-200">
              <p className="font-medium text-teal-900">👔 Admin</p>
              <p className="text-teal-700">admin@datadose.ai</p>
            </div>
            <div className="bg-gradient-teal-light/50 rounded p-2 border border-teal-200">
              <p className="font-medium text-teal-900">⚙️ Super Admin</p>
              <p className="text-teal-700">superadmin@datadose.ai</p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-slate-600 hover:text-teal-600 font-medium transition inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
