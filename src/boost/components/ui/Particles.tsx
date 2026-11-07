import { useMemo } from 'react';
import { useDevice } from '@/boost/context/DeviceContext';

export function Particles() {
  const { recommendedParticleCount } = useDevice();

  const particles = useMemo(
    () => {
      if (recommendedParticleCount <= 0) return [];
      const count = Math.min(18, recommendedParticleCount);
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${9 + Math.random() * 8}s`,
        size: Math.random() > 0.6 ? 3 : 2,
        opacity: 0.25 + Math.random() * 0.3,
      }));
    },
    [recommendedParticleCount],
  );

  if (recommendedParticleCount <= 0 || particles.length === 0) return null;

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
        />
      ))}
    </>
  );
}
