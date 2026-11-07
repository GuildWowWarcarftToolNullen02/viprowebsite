import { useEffect, useState } from 'react';
import { useDevice } from '@/context/DeviceContext';

interface Particle {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
}

export function Particles() {
  const { recommendedParticleCount } = useDevice();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (recommendedParticleCount <= 0) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: recommendedParticleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      animationDuration: `${12 + Math.random() * 14}s`,
      animationDelay: `${Math.random() * -20}s`,
    }));
    setParticles(newParticles);
  }, [recommendedParticleCount]);

  if (recommendedParticleCount <= 0 || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
