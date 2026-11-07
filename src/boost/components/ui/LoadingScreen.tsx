import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [hidden, setHidden] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1600);
    const t2 = setTimeout(() => setHidden(true), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (hidden) return null;

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <img
          src="/vippro-logo.png?v=4"
          alt="VipPro"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
          VipPro <span className="gradient-text">Boosts</span>
        </span>
      </div>
      <div className="loading-bar-container">
        <div className="loading-bar" />
      </div>
    </div>
  );
}
