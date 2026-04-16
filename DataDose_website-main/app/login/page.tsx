'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

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
        // Keep spinner while Next.js navigates — don't call setIsLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        padding: '2.5rem 2.5rem 2rem',
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f766e, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '26px',
          }}>💊</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            DataDose
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '0.875rem' }}>
            Smart Clinical Decision Support
          </p>
        </div>

        {/* ── Error Alert ── */}
        {error && (
          <div id="login-error-box" style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            color: '#b91c1c',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Form ── */}
        <form id="login-form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label htmlFor="email" style={{
              display: 'block', fontSize: '0.875rem',
              fontWeight: 600, color: '#374151', marginBottom: '0.4rem',
            }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@datadose.ai"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.75rem 1rem',
                border: '1.5px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0f766e'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="password" style={{
              display: 'block', fontSize: '0.875rem',
              fontWeight: 600, color: '#374151', marginBottom: '0.4rem',
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.75rem 1rem',
                border: '1.5px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#0f766e'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.35rem' }}>
              Demo password: <strong>password123</strong>
            </p>
          </div>

          {/* ── Submit Button ──
              Dual-hardened: Tailwind classes + inline styles.
              The button is NEVER transparent or invisible. */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-900 text-white font-semibold py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              boxSizing: 'border-box',
              /* Guaranteed visible colours — Tailwind is secondary */
              backgroundColor: '#18181b',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.9rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.65 : 1,
              transition: 'background-color 0.2s, opacity 0.2s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#27272a'; }}
            onMouseLeave={(e) => { if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = '#18181b'; }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '18px', height: '18px',
                  border: '2.5px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'datadose-spin 0.75s linear infinite',
                }} />
                Signing in…
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        {/* ── Demo accounts quick-fill ── */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
          <p style={{
            fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center',
            marginBottom: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Quick Fill — Demo Accounts
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { icon: '💊', role: 'Pharmacist',  addr: 'pharmacist@datadose.ai' },
              { icon: '🏥', role: 'Physician',   addr: 'physician@datadose.ai'  },
              { icon: '👔', role: 'Admin',       addr: 'admin@datadose.ai'      },
              { icon: '⚙️', role: 'Super Admin', addr: 'superadmin@datadose.ai' },
              { icon: '👤', role: 'Patient',     addr: 'sara@datadose.ai'       },
            ].map(({ icon, role, addr }) => (
              <button
                key={role}
                type="button"
                onClick={() => { setEmail(addr); setPassword('password123'); }}
                style={{
                  textAlign: 'left', padding: '0.5rem 0.65rem',
                  borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc', cursor: 'pointer',
                  fontSize: '0.72rem', transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.backgroundColor = '#e0f2fe'; }}
                onMouseLeave={(e) => { (e.currentTarget).style.backgroundColor = '#f8fafc'; }}
              >
                <span style={{ fontWeight: 700, color: '#334155' }}>{icon} {role}</span><br />
                <span style={{ color: '#64748b' }}>{addr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Back link ── */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <a href="/" style={{
            fontSize: '0.875rem', color: '#0f766e',
            textDecoration: 'none', fontWeight: 600,
          }}>
            ← Back to Home
          </a>
        </div>
      </div>

      <style>{`
        @keyframes datadose-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
