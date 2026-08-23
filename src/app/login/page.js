'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';
  const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Premium Co-Working & Interior Design';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Decorative ambient gradients matching GJ SpaCes branding */}
      <div className="login-ambient-1" />
      <div className="login-ambient-2" />

      <div className="login-card-container">
        <div className="login-card">
          {/* Brand Header */}
          <div className="login-brand-header">
            <div className="login-logo-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div className="login-badge">
              <Sparkles size={11} /> Admin Access
            </div>
            <h1 className="login-title">{brandName}</h1>
            <p className="login-subtitle">CallBot & Customer CRM Portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-alert">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <User className="login-field-icon" size={17} />
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock className="login-field-icon" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer security tag */}
          <div className="login-card-footer">
            <ShieldCheck size={14} style={{ color: 'var(--success, #22c55e)' }} />
            <span>Secure Authentication • {brandTagline}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fc;
          font-family: var(--font-body, 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif);
          position: fixed;
          inset: 0;
          z-index: 99999;
          overflow-y: auto;
          padding: 24px;
        }

        .login-ambient-1 {
          position: absolute;
          top: 15%;
          left: 30%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(47, 124, 255, 0.08) 0%, rgba(248, 249, 252, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-ambient-2 {
          position: absolute;
          bottom: 10%;
          right: 25%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(241, 124, 32, 0.07) 0%, rgba(248, 249, 252, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-card-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
        }

        .login-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 20px;
          padding: 44px 38px;
          box-shadow: 0 12px 40px -10px rgba(26, 29, 46, 0.08), 0 2px 6px -1px rgba(26, 29, 46, 0.04);
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-brand-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-logo-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2f7cff 0%, #1a6bef 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 6px 16px rgba(47, 124, 255, 0.3);
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #e8f0ff;
          color: #2f7cff;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 10px;
        }

        .login-title {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 24px;
          font-weight: 800;
          color: #1a1d2e;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }

        .login-subtitle {
          font-size: 13px;
          color: #5a6178;
        }

        .login-alert {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          text-align: center;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-label {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 600;
          color: #1a1d2e;
          letter-spacing: 0.2px;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-field-icon {
          position: absolute;
          left: 14px;
          color: #8b90a3;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          background: #f8f9fc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          color: #1a1d2e;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.15s ease;
          outline: none;
        }

        .login-input:focus {
          background: #ffffff;
          border-color: #2f7cff;
          box-shadow: 0 0 0 3.5px rgba(47, 124, 255, 0.12);
        }

        .login-input::placeholder {
          color: #b0b5c5;
        }

        .login-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #8b90a3;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .login-eye-btn:hover {
          color: #1a1d2e;
        }

        .login-btn {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #2f7cff 0%, #1a6bef 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 14px rgba(47, 124, 255, 0.28);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(47, 124, 255, 0.36);
          background: linear-gradient(135deg, #226ef0 0%, #125bd9 100%);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-card-footer {
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #8b90a3;
          text-align: center;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc' }}>
        <Loader2 size={32} style={{ color: '#2f7cff', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
