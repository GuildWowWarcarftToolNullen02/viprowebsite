import { useDevice } from '@/context/DeviceContext';

export function GridBackground() {
  return <div className="grid-overlay" aria-hidden="true" />;
}

export function GlowBlobs() {
  const { reducedGraphics } = useDevice();

  // Low-end / mobile / power-saver devices skip expensive 100px SVG blur animations
  if (reducedGraphics) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.04) 0%, transparent 60%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="glow-blob glow-blob-1" />
      <div className="glow-blob glow-blob-2" />
    </div>
  );
}
