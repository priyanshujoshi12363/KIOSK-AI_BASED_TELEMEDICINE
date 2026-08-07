export default function TricolorBar({ className = "", height = 6 }) {
  return (
    <div className={`flex w-full ${className}`} style={{ height }}>
      <div className="flex-1 bg-saffron" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-indiagreen" />
    </div>
  );
}
