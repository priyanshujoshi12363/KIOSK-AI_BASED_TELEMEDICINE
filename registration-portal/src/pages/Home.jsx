import { Link } from "react-router-dom";
import { Card } from "../components/ui.jsx";
import AshokaChakra from "../components/AshokaChakra.jsx";

const cards = [
  {
    to: "/register/doctor",
    title: "Register Doctor",
    desc: "Onboard verified medical practitioners with council registration and specialization.",
    accent: "from-saffron/15",
    tag: "Medical",
  },
  {
    to: "/register/asha",
    title: "Register ASHA Worker",
    desc: "Enroll accredited social health activists who deliver medicines to villages.",
    accent: "from-navy/10",
    tag: "Field Health",
  },
  {
    to: "/register/villager",
    title: "Register Villager",
    desc: "Enroll citizens with Aadhaar verification and secure biometric face capture.",
    accent: "from-indiagreen/15",
    tag: "Citizen",
  },
];

export default function Home() {
  return (
    <div className="animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 px-6 py-12 shadow-sm sm:px-12 sm:py-14">
        <div className="absolute right-4 top-4 hidden text-zinc-900/5 sm:block">
          <AshokaChakra size={180} spin />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
          <span className="h-2 w-2 rounded-full bg-indiagreen" />
          Government of Kerala · Digital Health Mission
        </span>
        <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
          AI-Assisted Tele-medicine
          <span className="bg-gradient-to-r from-saffron via-navy to-indiagreen bg-clip-text text-transparent">
            {" "}
            Registration Portal
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-600 sm:text-base">
          A unified, secure gateway to onboard doctors, ASHA workers, and villagers into the
          rural tele-medicine kiosk network — bringing expert healthcare to every village.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register/villager"
            className="rounded-lg bg-saffron px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-saffron/90"
          >
            Register a Villager
          </Link>
          <Link
            to="/register/doctor"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Register a Doctor
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group">
            <Card
              className={`relative h-full overflow-hidden bg-gradient-to-b ${c.accent} to-white p-6 transition group-hover:-translate-y-1 group-hover:shadow-md`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                {c.tag}
              </span>
              <h3 className="mt-2 text-xl font-bold text-zinc-900">{c.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{c.desc}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-saffron">
                Continue
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Aadhaar-secured", "Identity is hashed, never stored in raw form."],
          ["Biometric login", "Face recognition powers touchless villager access."],
          ["Multilingual", "Built for Malayalam, Hindi and English speakers."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">{t}</p>
            <p className="mt-1 text-xs text-zinc-600">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
