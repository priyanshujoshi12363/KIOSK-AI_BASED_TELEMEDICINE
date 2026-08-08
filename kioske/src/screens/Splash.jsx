import { useEffect } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import AshokaChakra from "../components/AshokaChakra.jsx";
import TricolorBar from "../components/TricolorBar.jsx";
import { preloadWhisper } from "../lib/whisper.js";
import { warmupOllama } from "../lib/ollama.js";
import { preloadTTS } from "../lib/speech.js";

export default function Splash() {
  const { go } = useKiosk();

  useEffect(() => {
    preloadWhisper();
    preloadTTS();
    warmupOllama();
    const timer = setTimeout(() => go("HOME"), 3000);
    return () => clearTimeout(timer);
  }, [go]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#12175f_0%,#01033a_70%)]">
      <TricolorBar className="absolute top-0" height={6} />

      <div className="absolute h-72 w-72 rounded-full bg-saffron/20 blur-[90px]" />
      <div className="absolute h-72 w-72 translate-y-40 rounded-full bg-indiagreen/20 blur-[90px]" />

      <div className="relative animate-float">
        <div className="animate-glow">
          <AshokaChakra size={168} spin className="text-white" />
        </div>
      </div>

      <h1 className="mt-12 text-6xl font-black tracking-tight text-white drop-shadow-lg">आरोग्य</h1>
      <p className="mt-3 text-xl font-semibold tracking-wide text-white/80">Aarogya Kiosk</p>
      <p className="mt-1 text-sm font-medium text-white/45">Government of Kerala · Tele-medicine</p>

      <div className="mt-10 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indiagreen" />
      </div>

      <TricolorBar className="absolute bottom-0" height={6} />
    </div>
  );
}
