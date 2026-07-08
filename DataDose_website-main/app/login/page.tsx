'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

          {/* Demo Mode Alert Banner */}
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-6 flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />
              <div>
                <h3 className="text-xs font-semibold text-amber-800">Demo authentication enabled</h3>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Database connection is bypassed. Use the test accounts below to log in.
                </p>
              </div>
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

          {/* Demo accounts — only visible in development when demo mode is active */}
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">
                Demo Accounts (Local Dev Only)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Physician', addr: 'physician@datadose.test', pass: 'physician123' },
                  { role: 'Pharmacist', addr: 'pharmacist@datadose.test', pass: 'pharmacist123' },
                  { role: 'Patient', addr: 'patient@datadose.test', pass: 'patient123' },
                  { role: 'Hospital Admin', addr: 'admin@datadose.test', pass: 'admin123' },
                  { role: 'Super Admin', addr: 'system@datadose.test', pass: 'system123' },
                ].map(({ role, addr, pass }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(addr); setPassword(pass); }}
                    className="text-left px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-slate-700">{role}</span>
                    <br />
                    <span className="text-slate-400">{addr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
