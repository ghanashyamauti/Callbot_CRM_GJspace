'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  PhoneCall,
  Activity,
  Headphones,
  CheckCircle,
  Database
} from 'lucide-react';

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
      setError('Please enter both username and password.');
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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pro-login-screen">
      <div className="pro-login-layout">
        
        {/* ================= LEFT: BRAND & HERO SHOWCASE ================= */}
        <div className="pro-brand-panel">
          <div className="pro-brand-gradient-overlay" />
          
          <div className="pro-brand-content">
            {/* Top Brand Logo */}
            <div className="pro-brand-top">
              <div className="pro-brand-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <div>
                <span className="pro-brand-title">{brandName}</span>
                <span className="pro-brand-tag">CallBot CRM</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="pro-hero-text">
              <div className="pro-pill-badge">
                <span className="pro-dot-pulse" />
                AI Voice Telephony & Customer Hub
              </div>
              <h2 className="pro-headline">
                Intelligent Customer Operations for <span className="pro-accent-gradient">{brandName}</span>
              </h2>
              <p className="pro-subheadline">
                Manage live telephony calls with Sakshi, review real-time multilingual customer transcripts, and analyze customer sentiment seamlessly in MongoDB.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="pro-features-grid">
              <div className="pro-feature-item">
                <div className="pro-feature-icon-box blue">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="pro-feature-title">AI Voice Bot (Sakshi)</div>
                  <div className="pro-feature-desc">English, Hindi & Marathi speech handling</div>
                </div>
              </div>

              <div className="pro-feature-item">
                <div className="pro-feature-icon-box orange">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <div className="pro-feature-title">Twilio Integration</div>
                  <div className="pro-feature-desc">Inbound telephony & voicemail recording</div>
                </div>
              </div>

              <div className="pro-feature-item">
                <div className="pro-feature-icon-box green">
                  <Database size={16} />
                </div>
                <div>
                  <div className="pro-feature-title">Cloud MongoDB CRM</div>
                  <div className="pro-feature-desc">Automatic persistence, history & analytics</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pro-panel-footer">
              <span>{brandTagline}</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: AUTHENTICATION FORM ================= */}
        <div className="pro-form-panel">
          <div className="pro-form-card">
            
            {/* Mobile Header (visible only on smaller screens) */}
            <div className="pro-mobile-header">
              <div className="pro-brand-logo-icon" style={{ margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <h3 className="pro-mobile-title">{brandName}</h3>
              <p className="pro-mobile-sub">CallBot CRM Portal</p>
            </div>

            <div className="pro-form-head">
              <h1 className="pro-card-title">Welcome Back</h1>
              <p className="pro-card-subtitle">Sign in with your admin credentials to access the CRM</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="pro-alert-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="pro-auth-form">
              <div className="pro-input-group">
                <label className="pro-input-label">Username</label>
                <div className="pro-input-field-wrap">
                  <User className="pro-input-icon" size={17} />
                  <input
                    type="text"
                    className="pro-input"
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="pro-input-group">
                <label className="pro-input-label">Password</label>
                <div className="pro-input-field-wrap">
                  <Lock className="pro-input-icon" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="pro-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pro-password-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="pro-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="pro-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="pro-form-footer">
              <div className="pro-security-badge">
                <ShieldCheck size={14} className="pro-shield-icon" />
                <span>256-bit Encrypted Admin Session</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <style jsx>{`
        .pro-login-screen {
          min-height: 100vh;
          width: 100vw;
          background: #f8f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body, 'DM Sans', -apple-system, sans-serif);
          position: fixed;
          inset: 0;
          z-index: 99999;
          overflow-y: auto;
          padding: 16px;
        }

        .pro-login-layout {
          display: flex;
          width: 100%;
          max-width: 880px;
          min-height: 500px;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 16px 45px -12px rgba(26, 29, 46, 0.09), 0 0 0 1px rgba(226, 232, 240, 0.8);
        }

        /* ---------------- LEFT PANEL ---------------- */
        .pro-brand-panel {
          flex: 1.1;
          background: linear-gradient(145deg, #111838 0%, #172154 50%, #0d1433 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 32px 36px;
          color: #ffffff;
          overflow: hidden;
        }

        .pro-brand-gradient-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 10% 20%, rgba(47, 124, 255, 0.22) 0%, transparent 60%),
                      radial-gradient(circle at 90% 80%, rgba(241, 124, 32, 0.18) 0%, transparent 60%);
          pointer-events: none;
        }

        .pro-brand-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .pro-brand-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pro-brand-logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2f7cff 0%, #f17c20 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(47, 124, 255, 0.3);
          flex-shrink: 0;
        }

        .pro-brand-title {
          display: block;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.2px;
          line-height: 1.2;
        }

        .pro-brand-tag {
          font-size: 10.5px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .pro-hero-text {
          margin: 20px 0 18px;
        }

        .pro-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10.5px;
          font-weight: 600;
          color: #93c5fd;
          margin-bottom: 12px;
        }

        .pro-dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }

        .pro-headline {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 21px;
          font-weight: 800;
          line-height: 1.35;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .pro-accent-gradient {
          background: linear-gradient(135deg, #60a5fa 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pro-subheadline {
          font-size: 12.5px;
          color: #cbd5e1;
          line-height: 1.55;
        }

        .pro-features-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .pro-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 9px 13px;
          border-radius: 11px;
          backdrop-filter: blur(8px);
        }

        .pro-feature-icon-box {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pro-feature-icon-box.blue {
          background: rgba(47, 124, 255, 0.2);
          color: #60a5fa;
        }

        .pro-feature-icon-box.orange {
          background: rgba(241, 124, 32, 0.2);
          color: #fb923c;
        }

        .pro-feature-icon-box.green {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .pro-feature-title {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
        }

        .pro-feature-desc {
          font-size: 11px;
          color: #94a3b8;
        }

        .pro-panel-footer {
          font-size: 10.5px;
          color: #64748b;
          letter-spacing: 0.2px;
        }

        /* ---------------- RIGHT PANEL ---------------- */
        .pro-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 38px;
          background: #ffffff;
        }

        .pro-form-card {
          width: 100%;
          max-width: 330px;
        }

        .pro-mobile-header {
          display: none;
          text-align: center;
          margin-bottom: 20px;
        }

        .pro-mobile-title {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 18px;
          font-weight: 800;
          color: #1a1d2e;
        }

        .pro-mobile-sub {
          font-size: 11.5px;
          color: #5a6178;
        }

        .pro-form-head {
          margin-bottom: 22px;
        }

        .pro-card-title {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 21px;
          font-weight: 800;
          color: #1a1d2e;
          margin-bottom: 4px;
          letter-spacing: -0.3px;
        }

        .pro-card-subtitle {
          font-size: 12.5px;
          color: #5a6178;
          line-height: 1.45;
        }

        .pro-alert-error {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #dc2626;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .pro-auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .pro-input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .pro-input-label {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 600;
          color: #1a1d2e;
          letter-spacing: 0.2px;
        }

        .pro-input-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pro-input-icon {
          position: absolute;
          left: 13px;
          color: #8b90a3;
          pointer-events: none;
        }

        .pro-input {
          width: 100%;
          background: #f8f9fc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10.5px 12px 10.5px 38px;
          color: #1a1d2e;
          font-size: 13.5px;
          font-family: inherit;
          transition: all 0.15s ease;
          outline: none;
        }

        .pro-input:focus {
          background: #ffffff;
          border-color: #2f7cff;
          box-shadow: 0 0 0 3px rgba(47, 124, 255, 0.12);
        }

        .pro-input::placeholder {
          color: #b0b5c5;
        }

        .pro-password-eye {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #8b90a3;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .pro-password-eye:hover {
          color: #1a1d2e;
        }

        .pro-submit-button {
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2f7cff 0%, #f17c20 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(47, 124, 255, 0.25);
        }

        .pro-submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(47, 124, 255, 0.35);
          filter: brightness(1.04);
        }

        .pro-submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .pro-submit-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .pro-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .pro-form-footer {
          margin-top: 22px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }

        .pro-security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          color: #64748b;
        }

        .pro-shield-icon {
          color: #22c55e;
        }

        /* ---------------- RESPONSIVE MEDIA QUERIES ---------------- */
        @media (max-width: 840px) {
          .pro-brand-panel {
            display: none;
          }
          .pro-mobile-header {
            display: block;
          }
          .pro-login-layout {
            max-width: 400px;
            min-height: auto;
            border-radius: 16px;
          }
          .pro-form-panel {
            padding: 30px 24px;
          }
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
