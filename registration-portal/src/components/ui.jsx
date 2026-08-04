export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/60 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-saffron">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/25";

export function Input(props) {
  return <input {...props} className={inputBase} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${inputBase} min-h-20 resize-y`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputBase} appearance-none`}>
      {children}
    </select>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary:
      "bg-saffron text-zinc-950 hover:bg-saffron/90 focus:ring-saffron/40 font-semibold shadow-sm",
    ghost:
      "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 focus:ring-zinc-400/40 border border-zinc-200",
    outline:
      "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-300 focus:ring-zinc-300/40",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Alert({ type = "info", children }) {
  const styles = {
    success: "border-indiagreen/30 bg-indiagreen/10 text-emerald-800",
    error: "border-red-300 bg-red-50 text-red-700",
    info: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>{children}</div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-widest text-saffron">
          {eyebrow}
        </span>
      )}
      <h1 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-600">{subtitle}</p>}
    </div>
  );
}
