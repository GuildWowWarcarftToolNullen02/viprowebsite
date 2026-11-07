import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TurnstileWidget } from '@/components/ui/TurnstileWidget';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const base = import.meta.env.BASE_URL;

// ── SVG Brand Icons ──────────────────────────────────────────────

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden fill="none">
      <path
        fill="currentColor"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.014.044.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"
      />
      <ellipse fill="white" cx="8.5" cy="12.5" rx="1.45" ry="1.65" />
      <ellipse fill="white" cx="15.5" cy="12.5" rx="1.45" ry="1.65" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Error Codes → Messages ───────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:      'Authentication failed. Please try again.',
  turnstile_failed:  'Security check failed. Please refresh and try again.',
  oauth_error:       'An error occurred during sign-in. Please try again.',
  missing_turnstile: 'Security verification required. Please wait and retry.',
  invalid_token:     'Verification link is invalid or expired.',
};

// ── Resend Verification Button ───────────────────────────────────

function ResendButton({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; error?: string; remaining?: number };
      if (res.status === 429 && data.remaining) {
        setCooldown(data.remaining);
      } else if (res.ok) {
        setCooldown(60);
        setSent(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <button
        onClick={handleResend}
        disabled={cooldown > 0 || loading}
        className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Sending…' : cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend verification email'}
      </button>
      {sent && cooldown > 0 && (
        <p className="text-[11px] text-white/40">Sent! Check your inbox again.</p>
      )}
    </div>
  );
}

// ── Forgot Password View ─────────────────────────────────────────

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to send reset email. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        key="forgot-sent"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="py-4 flex flex-col items-center text-center gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-white/80" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Check your inbox</h3>
          <p className="text-xs text-white/45 leading-relaxed max-w-[280px]">
            If an account exists for <span className="text-white/70">{email}</span>, you'll
            receive a password reset link shortly. It expires in <span className="text-white/70">15 minutes</span>.
          </p>
        </div>
        <div className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left">
          <p className="text-[11px] text-white/35 leading-relaxed">
            <span className="text-white/55 font-semibold">Can't find it?</span>{' '}
            Check your spam folder — the email comes from{' '}
            <span className="font-mono text-white/50">noreply@mskhub.store</span>
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-white/40 hover:text-white transition-colors"
        >
          Back to Log In
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      key="forgot"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Reset password</h2>
        <p className="text-xs text-white/40 mt-1">Enter your email and we'll send a recovery link.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-white/60">Email address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs leading-relaxed">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
      >
        {loading ? 'Sending link…' : 'Send reset link'}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-white/40 hover:text-white transition-colors"
        >
          Back to Log In
        </button>
      </div>
    </motion.form>
  );
}

// ── Main Login Page (Login Page 10 Layout) ───────────────────────

type Tab = 'signin' | 'register';

export default function Login() {
  const { user, loading } = useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [showForgot, setShowForgot] = useState(false);

  // Shared state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In fields
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);

  // Register fields
  const [regDisplay, setRegDisplay] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPw, setRegShowPw] = useState(false);
  const [regAgree, setRegAgree] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setRegSuccess(false);
    setShowForgot(false);
  };

  // Parse URL error param & reason
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    const reason = params.get('reason');
    if (code) {
      let msg = ERROR_MESSAGES[code] ?? 'Authentication error. Please try again.';
      if (reason) msg += ` (${reason})`;
      setError(msg);
    }
  }, []);

  if (!loading && user) {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from === 'dashboard') {
      window.location.href = 'https://dashboard.mskhub.store';
      return null;
    }
    return <Redirect to="/" />;
  }

  const handleProvider = (provider: 'discord' | 'google') => {
    if (!turnstileToken) {
      setError('Please wait for the security check to complete.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const from = new URLSearchParams(window.location.search).get('from');
    let url = `/api/auth/${provider}?t=${encodeURIComponent(turnstileToken)}`;
    if (from) url += `&from=${encodeURIComponent(from)}`;
    window.location.href = url;
  };

  const handleToken = (token: string) => {
    setTurnstileToken(token);
    setError(null);
  };

  const handleExpire = () => {
    setTurnstileToken(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { setError('Security check not complete.'); return; }
    if (!siEmail || !siPassword) { setError('Please fill in all fields.'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: siEmail, password: siPassword, turnstileToken }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Sign in failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const from = new URLSearchParams(window.location.search).get('from');
      const hostname = window.location.hostname;
      if (from === 'dashboard') {
        window.location.href = hostname === 'dashboard.mskhub.store' ? '/' : 'https://dashboard.mskhub.store';
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regAgree) { setError('Please accept the Terms of Service to continue.'); return; }
    if (!turnstileToken) { setError('Security check not complete.'); return; }
    if (!regDisplay || !regEmail || !regPassword) { setError('Please fill in all fields.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: regDisplay, email: regEmail, password: regPassword, turnstileToken }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setRegSuccess(true);
      setIsSubmitting(false);
    } catch {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 sm:px-6">

        {/* Apex watermark - background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          <div className="absolute -right-24 md:-right-12 top-1/2 -translate-y-1/2 opacity-[0.06] lg:opacity-[0.08]">
            <img
              src={`${base}apex-model.png`}
              alt=""
              className="w-[680px] h-[680px] object-contain animate-[apexFloat_6s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[130px]" />
          <div className="absolute right-10 top-20 w-[300px] h-[300px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
        </div>

        {/* ── Login-10 Auth Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-7 sm:p-9 shadow-lg relative z-10"
        >

          {/* ── Brand Header ── */}
          <header className="flex items-center gap-3.5 mb-6">
            <img src={`${base}msk-logo.png`} alt="MSK Hub" className="w-9 h-9 object-contain" />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-black text-white tracking-tight">MSK</span>
                <span className="text-base font-semibold text-white/50">Hub</span>
              </div>
              <p className="text-xs text-white/40 mt-1 font-medium">Access your account and orders</p>
            </div>
          </header>

          {/* ── Pill Tab Switcher (Login-10 Thumb Slider) ── */}
          {!showForgot && (
            <div className="relative grid grid-cols-2 p-1 rounded-full bg-white/[0.04] border border-white/10 mb-6">
              <motion.span
                className="absolute top-1 bottom-1 rounded-full bg-white shadow-lg"
                style={{ width: 'calc(50% - 4px)' }}
                animate={{ left: tab === 'signin' ? '4px' : 'calc(50%)' }}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => switchTab('signin')}
                className={`relative z-10 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                  tab === 'signin' ? 'text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                className={`relative z-10 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                  tab === 'register' ? 'text-black' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* ── Error Banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {/* ── Content Panels ── */}
          <AnimatePresence mode="wait">
            {showForgot ? (
              <ForgotPasswordView key="forgot" onBack={() => setShowForgot(false)} />
            ) : tab === 'signin' ? (

              /* ── LOG IN PANEL ── */
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignIn}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
                  <p className="text-xs text-white/40 mt-0.5">Sign in to manage your keys and orders.</p>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] focus:ring-2 focus:ring-white/10 transition-all"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/70">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs font-medium text-white/40 hover:text-white transition-colors"
                    >
                      Forgot it?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={siShowPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] focus:ring-2 focus:ring-white/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setSiShowPw(!siShowPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                      {siShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Security Turnstile */}
                <div className="pt-1">
                  <TurnstileWidget
                    onToken={handleToken}
                    onExpire={handleExpire}
                    onError={() => setError('Security check failed. Please refresh.')}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.985 }}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? 'Signing in…' : 'Log in'}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProvider('discord')}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/90 transition-all disabled:opacity-40"
                  >
                    <DiscordIcon />
                    <span>Discord</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProvider('google')}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/90 transition-all disabled:opacity-40"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </motion.button>
                </div>

                {/* Swap Prompt */}
                <p className="text-center text-xs text-white/40 pt-2">
                  New to MSKHUB?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('register')}
                    className="text-white font-semibold hover:underline transition-all ml-1"
                  >
                    Create an account
                  </button>
                </p>
              </motion.form>

            ) : regSuccess ? (

              /* ── REGISTER SUCCESS ── */
              <motion.div
                key="register-success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-4 flex flex-col items-center text-center gap-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-white/80" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Check your inbox</h3>
                  <p className="text-xs text-white/45 leading-relaxed max-w-[280px]">
                    We sent a verification link to{' '}
                    <span className="text-white/75 font-semibold">{regEmail}</span>.
                    Click it to activate your account.
                  </p>
                </div>

        <div className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left">
          <p className="text-[11px] text-white/35 leading-relaxed">
            <span className="text-white/55 font-semibold">Can't find it?</span>{' '}
            Check your spam folder — the email comes from{' '}
            <span className="font-mono text-white/50">noreply@mskhub.store</span>
          </p>
        </div>

                <ResendButton email={regEmail} />

                <button
                  onClick={() => switchTab('signin')}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  Back to Log In
                </button>
              </motion.div>

            ) : (

              /* ── CREATE ACCOUNT PANEL ── */
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Create an account</h2>
                  <p className="text-xs text-white/40 mt-0.5">Instant access to downloads and purchases.</p>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Your username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={regDisplay}
                    onChange={(e) => setRegDisplay(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Create a password</label>
                  <div className="relative">
                    <input
                      type={regShowPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPw(!regShowPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                      {regShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/35 leading-relaxed">
                    At least 8 characters.
                  </p>
                </div>

                {/* Terms of Service Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                  <div
                    onClick={() => setRegAgree(!regAgree)}
                    className={`mt-0.5 w-4 h-4 shrink-0 rounded border transition-all ${
                      regAgree ? 'bg-white border-white' : 'border-white/20 bg-white/5 group-hover:border-white/35'
                    }`}
                  >
                    {regAgree && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                        <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] text-white/40 leading-relaxed">
                    I agree to the{' '}
                    <a href="/tos" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/tos" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</a>
                  </span>
                </label>

                {/* Security Turnstile */}
                <div className="pt-1">
                  <TurnstileWidget
                    onToken={handleToken}
                    onExpire={handleExpire}
                    onError={() => setError('Security check failed. Please refresh.')}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.985 }}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProvider('discord')}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/90 transition-all disabled:opacity-40"
                  >
                    <DiscordIcon />
                    <span>Discord</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProvider('google')}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/90 transition-all disabled:opacity-40"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </motion.button>
                </div>

                {/* Swap Prompt */}
                <p className="text-center text-xs text-white/40 pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signin')}
                    className="text-white font-semibold hover:underline transition-all ml-1"
                  >
                    Log in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </PageWrapper>
  );
}
