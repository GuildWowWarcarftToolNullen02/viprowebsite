import { useEffect, useState } from 'react';

const STATUS_LINES = [
  'Initializing modules',
  'Loading security layer',
  'Verifying license',
  'Ready',
];

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('msk_visited');
    if (hasVisited) {
      setVisible(false);
      return;
    }

    // Progress animation - ramp to 100% over 2s
    const start = performance.now();
    const duration = 2000;
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(Math.round(eased * 100));
      if (raw < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Cycle status lines
    const intervals: ReturnType<typeof setTimeout>[] = [];
    STATUS_LINES.forEach((_, i) => {
      if (i === 0) return;
      intervals.push(
        setTimeout(() => setStatusIdx(i), (2000 / STATUS_LINES.length) * i),
      );
    });

    // Begin fade
    const t1 = setTimeout(() => setFading(true), 2200);
    // Remove
    const t2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('msk_visited', 'true');
    }, 2800);

    return () => {
      cancelAnimationFrame(raf);
      intervals.forEach(clearTimeout);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  const circumference = 2 * Math.PI * 44; // r=44

  return (
    <div
      className="loading-screen"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      data-testid="loading-screen"
    >
      {/* Grid overlay (matches site background) */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: '50px 50px',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
        }}
      />

      {/* Central content */}
      <div className="relative flex flex-col items-center justify-center gap-10 z-10">

        {/* SVG ring system */}
        <div className="relative flex items-center justify-center">

          {/* Outermost slow-spin ring */}
          <div className="absolute w-52 h-52 rounded-full border border-white/[0.05] animate-[spin_18s_linear_infinite]" />
          {/* Mid ring reverse */}
          <div className="absolute w-40 h-40 rounded-full border border-white/[0.08] animate-[spin_12s_linear_infinite_reverse]" />

          {/* Progress arc */}
          <svg
            className="absolute w-36 h-36 -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Track */}
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>

          {/* Glow blob */}
          <div className="absolute w-32 h-32 rounded-full bg-white/[0.05] blur-2xl" />

          {/* Logo + wordmark inside the ring */}
          <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24">
            <img
              src={`${import.meta.env.BASE_URL}msk-logo.png`}
              alt="MSK Hub"
              className="w-10 h-10 object-contain mb-1 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
            />
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-white tracking-tighter leading-none">MSK</span>
              <span className="text-xs font-semibold text-white/50 leading-none">Hub</span>
            </div>
          </div>
        </div>

        {/* Status + percentage */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 h-5">
            <span className="w-1 h-1 rounded-full bg-white/50 animate-pulse" />
            <span
              key={statusIdx}
              className="text-xs text-white/40 tracking-[0.15em] uppercase font-medium"
              style={{ animation: 'fadeInUp 0.3s ease both' }}
            >
              {STATUS_LINES[statusIdx]}
            </span>
          </div>

          {/* Thin progress bar */}
          <div className="w-48 h-px bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full"
              style={{
                width: `${progress}%`,
                transition: 'width 0.05s linear',
                boxShadow: '0 0 8px rgba(255,255,255,0.4)',
              }}
            />
          </div>

          <span className="text-[10px] font-black text-white/20 tabular-nums tracking-widest">
            {String(progress).padStart(3, '0')}%
          </span>
        </div>
      </div>
    </div>
  );
}
