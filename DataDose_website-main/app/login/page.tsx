'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Demo account definitions (kept in sync with lib/auth.ts DEMO_USERS) ──────
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    label: 'Hospital Admin',
    email: 'admin@datadose.demo',
    password: 'Demo@Admin2026',
    color: 'text-violet-700',
    bg: 'hover:bg-violet-50 hover:border-violet-300',
    dot: 'bg-violet-500',
  },
  {
    role: 'Physician',
    label: 'Physician',
    email: 'physician@datadose.demo',
    password: 'Demo@Physician2026',
    color: 'text-teal-700',
    bg: 'hover:bg-teal-50 hover:border-teal-300',
    dot: 'bg-teal-500',
  },
  {
    role: 'Pharmacist',
    label: 'Pharmacist',
    email: 'pharmacist@datadose.demo',
    password: 'Demo@Pharmacist2026',
    color: 'text-blue-700',
    bg: 'hover:bg-blue-50 hover:border-blue-300',
    dot: 'bg-blue-500',
  },
  {
    role: 'Patient',
    label: 'Patient',
    email: 'patient@datadose.demo',
    password: 'Demo@Patient2026',
    color: 'text-amber-700',
    bg: 'hover:bg-amber-50 hover:border-amber-300',
    dot: 'bg-amber-500',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', { redirect: false, email, password });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else if (res?.ok) {
        const session = await getSession();
        const role = (session?.user as any)?.role;

        if (role === 'SUPER_ADMIN') {
          router.push('/dashboard/system');
        } else if (role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (role === 'PHARMACIST') {
          router.push('/dashboard/pharmacist');
        } else if (role === 'PATIENT') {
          router.push('/dashboard/patient');
        } else {
          router.push('/dashboard/physician');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/logo.svg" className="h-16 w-auto object-contain mx-auto mb-4" alt="DataDose Logo" />
            <p className="text-sm text-slate-500 mt-1">
              Clinical Decision Support System
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@hospital.org"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-teal-700 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* ── Demo Accounts Panel ─────────────────────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            {/* Collapsible toggle */}
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-teal-700 transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-600" />
                Demo Accounts — click to auto-fill
              </span>
              {demoOpen
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>

            {demoOpen && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className={`text-left px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 ${acc.bg} transition-all duration-150 group cursor-pointer`}
                  >
                    <span className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${acc.dot} shrink-0`} />
                      <span className={`text-xs font-bold ${acc.color}`}>{acc.label}</span>
                    </span>
                    <span className="block text-[10px] text-slate-400 leading-tight truncate">
                      {acc.email}
                    </span>
                    <span className="block text-[10px] text-slate-300 mt-0.5">
                      ↑ Click to auto-fill
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Password hint shown when panel is open */}
            {demoOpen && (
              <p className="mt-2 text-[10px] text-center text-slate-400">
                All demo accounts use role-specific passwords. Click a card, then press <strong>Sign In</strong>.
              </p>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <a href="/" className="text-sm text-slate-500 hover:text-teal-700 font-medium flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
