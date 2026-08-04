import TricolorBar from "./TricolorBar.jsx";

export default function Footer() {
  return (
    <footer className="mt-16">
      <TricolorBar />
      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Government of Kerala · AI Tele-medicine Kiosk
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-indiagreen" />
            Secure Government Registration Portal
          </p>
        </div>
      </div>
    </footer>
  );
}
