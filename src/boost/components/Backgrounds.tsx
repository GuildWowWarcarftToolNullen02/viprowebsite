export default function GridBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
}

export function GlowBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top-left blob */}
      <div
        className="absolute animate-float-slow animate-glow-pulse"
        style={{
          width: '600px',
          height: '600px',
          top: '-200px',
          left: '-200px',
          background: 'radial-gradient(circle, rgba(255, 255, 255,0.18) 0%, rgba(255, 255, 255,0.06) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animationDelay: '0s',
        }}
      />
      {/* Top-right blob */}
      <div
        className="absolute animate-float-slow"
        style={{
          width: '500px',
          height: '500px',
          top: '-100px',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(200, 200, 200,0.14) 0%, rgba(255, 255, 255,0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animationDelay: '-3s',
          animationDuration: '10s',
        }}
      />
      {/* Bottom-center blob */}
      <div
        className="absolute animate-float-slow animate-glow-pulse"
        style={{
          width: '700px',
          height: '700px',
          bottom: '-300px',
          left: '30%',
          background: 'radial-gradient(circle, rgba(255, 255, 255,0.10) 0%, rgba(200, 200, 200,0.04) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animationDelay: '-6s',
          animationDuration: '12s',
        }}
      />
    </div>
  );
}
