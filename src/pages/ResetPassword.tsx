import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <PageWrapper>
        <div className="min-h-[80vh] flex items-center justify-center px-6">
          <div className="glass-card w-full max-w-[400px] p-8 text-center space-y-4">
            <XCircle size={36} className="text-red-400 mx-auto" />
            <h2 className="text-lg font-black text-white">Invalid Link</h2>
            <p className="text-sm text-white/40">This password reset link is missing or invalid.</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
              Back to Sign In
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password. The link may have expired.');
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[88vh] flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card w-full max-w-[420px]"
        >
          <div className="p-8 space-y-6">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}msk-logo.png`} alt="MSK Hub" className="h-8 w-auto object-contain" />
              <div className="leading-none">
                <span className="text-base font-black text-white tracking-tighter">MSK</span>
                <span className="text-sm font-medium text-accent ml-1">Hub</span>
              </div>
            </div>

            {success ? (
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-white/80" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight">Password updated!</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Your password has been reset. Redirecting you to sign in…
                  </p>
                </div>
                <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">
                  Sign In Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Set new password</h2>
                  <p className="text-xs text-white/35 mt-1">Choose a strong password for your account.</p>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 tracking-wide uppercase">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/25">At least 8 characters.</p>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 tracking-wide uppercase">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400/90 text-xs leading-relaxed px-1"
                  >
                    {error}
                  </motion.p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                  {loading ? 'Updating…' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full text-xs text-white/30 hover:text-white/60 transition-colors text-center"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
