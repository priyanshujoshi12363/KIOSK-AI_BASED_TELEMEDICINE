import { Link, NavLink } from "react-router-dom";
import AshokaChakra from "./AshokaChakra.jsx";
import TricolorBar from "./TricolorBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/register/doctor", label: "Doctor" },
  { to: "/register/asha", label: "ASHA Worker" },
  { to: "/register/villager", label: "Villager" },
];

function linkClass({ isActive }) {
  return `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? "bg-zinc-900 text-white"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
}

export default function Navbar() {
  const { operator, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40">
      <TricolorBar />
      <div className="border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <AshokaChakra size={38} className="text-navy" />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-zinc-900">
                Aarogya Kiosk
              </span>
              <span className="block text-[11px] text-zinc-500">
                Government of Kerala · Tele-medicine
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {operator ? (
              <>
                <span className="hidden text-xs text-zinc-600 sm:block">
                  {operator.name}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
              >
                Operator Login
              </Link>
            )}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-3 py-2 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
