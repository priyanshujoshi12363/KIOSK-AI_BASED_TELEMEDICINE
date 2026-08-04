export default function AshokaChakra({ size = 40, className = "", spin = false }) {
  const spokes = Array.from({ length: 24 });
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${spin ? "animate-spin-slow" : ""} ${className}`}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" fill="currentColor" />
      {spokes.map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.6"
          transform={`rotate(${i * 15} 50 50)`}
        />
      ))}
    </svg>
  );
}
