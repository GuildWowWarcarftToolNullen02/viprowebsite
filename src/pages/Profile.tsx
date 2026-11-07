import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';

const base = import.meta.env.BASE_URL;

export default function Profile() {
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  if (!loading && !user) return <Redirect to="/login" />;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-12 text-center"
        >
          {/* Avatar / logo */}
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 rounded-full bg-white/5 blur-[30px]" />
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="relative z-10 w-20 h-20 rounded-full border-2 border-white/15 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${base}msk-logo.png`;
                }}
              />
            ) : (
              <img src={`${base}msk-logo.png`} alt="MSK Hub" className="relative z-10 w-14 h-14 object-contain" />
            )}
          </div>

          {/* Username */}
          {user && (
            <div className="mb-10">
              <p className="text-xl font-black text-white mb-1">{user.username}</p>
              <p className="text-xs text-white/30 uppercase tracking-widest capitalize">
                via {user.provider}
                {user.email && <span className="ml-2 normal-case">· {user.email}</span>}
              </p>
            </div>
          )}

          {/* Apex decoration */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/3 blur-[40px]" />
              <img
                src={`${base}apex-eyes.png`}
                alt="Apex"
                className="relative z-10 w-32 h-32 object-contain opacity-60 animate-[apexFloat_5s_ease-in-out_infinite]"
              />
            </div>
          </div>

          {/* Coming Soon message */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            In Development
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-3">
            Coming Soon
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-8">
            Your MSK Hub profile dashboard is currently in development.
            Join our Discord to get notified when it launches.
          </p>

          <a
            href="https://discord.gg/BcwHsh3zBk"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-8 py-3 text-sm"
          >
            Join Discord
          </a>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
