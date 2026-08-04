export default function TricolorBar({ className = "" }) {
  return (
    <div className={`flex h-1.5 w-full ${className}`}>
      <div className="flex-1 bg-saffron" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-indiagreen" />
    </div>
  );
}
