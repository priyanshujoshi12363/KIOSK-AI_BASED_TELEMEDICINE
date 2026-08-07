export default function TricolorRing({ size = 200, thickness = 7, spin = true, children }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={`tricolor-conic absolute inset-0 rounded-full ${spin ? "animate-spin-ring" : ""}`}
      />
      <div
        className="absolute rounded-full bg-white"
        style={{ inset: thickness - 3 }}
      />
      <div
        className="absolute overflow-hidden rounded-full bg-zinc-900 shadow-2xl"
        style={{ inset: thickness }}
      >
        {children}
      </div>
    </div>
  );
}
