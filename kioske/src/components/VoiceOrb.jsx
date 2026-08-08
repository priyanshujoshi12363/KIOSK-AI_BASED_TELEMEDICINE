import { useEffect, useRef } from "react";

const BARS = 9;

export default function VoiceOrb({ levelRef, active, size = 260 }) {
  const ringRefs = useRef([]);
  const barRefs = useRef([]);
  const coreRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let smoothed = 0;
    const phases = Array.from({ length: BARS }, (_, i) => i * 0.7);

    const tick = () => {
      const target = active ? levelRef.current || 0 : 0;
      smoothed += (target - smoothed) * 0.22;

      ringRefs.current.forEach((el, i) => {
        if (!el) return;
        const scale = 1 + smoothed * (0.32 + i * 0.26);
        el.style.transform = `scale(${scale})`;
        el.style.opacity = String(Math.max(0, 0.5 - i * 0.14 + smoothed * 0.35));
      });

      if (coreRef.current) {
        coreRef.current.style.transform = `scale(${1 + smoothed * 0.14})`;
      }

      const now = performance.now() / 220;
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const wave = 0.55 + 0.45 * Math.sin(now + phases[i]);
        const h = 8 + smoothed * 58 * wave;
        el.style.height = `${h}px`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levelRef, active]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            ref={(el) => (ringRefs.current[i] = el)}
            className="absolute rounded-full border-4 border-red-500"
            style={{
              width: size * 0.55,
              height: size * 0.55,
              transition: "opacity 120ms linear",
            }}
          />
        ))}

        <div
          ref={coreRef}
          className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl"
          style={{ width: size * 0.44, height: size * 0.44 }}
        >
          <span className="text-6xl">🎙️</span>
        </div>
      </div>

      <div className="mt-6 flex h-[70px] items-end gap-1.5">
        {Array.from({ length: BARS }).map((_, i) => (
          <span
            key={i}
            ref={(el) => (barRefs.current[i] = el)}
            className="w-2.5 rounded-full bg-gradient-to-t from-red-600 to-red-400"
            style={{ height: 8 }}
          />
        ))}
      </div>
    </div>
  );
}
