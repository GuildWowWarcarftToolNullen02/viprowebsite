export function Backgrounds() {
  return (
    <>
      <div className="grid-overlay" />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="glow-blob glow-blob-1" />
        <div className="glow-blob glow-blob-2" />
        <div className="glow-blob glow-blob-3" />
      </div>
    </>
  );
}
