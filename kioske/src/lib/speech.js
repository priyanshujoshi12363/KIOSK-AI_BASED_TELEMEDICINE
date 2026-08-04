export function speak(text, locale) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.95;
    u.pitch = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
    setTimeout(resolve, 9000);
  });
}

export function getRecognizer() {
  const SR =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  return SR || null;
}

export function listenOnce(locale) {
  return new Promise((resolve, reject) => {
    const SR = getRecognizer();
    if (!SR) {
      reject(new Error("no-stt"));
      return;
    }
    const rec = new SR();
    rec.lang = locale;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => resolve(e.results[0][0].transcript);
    rec.onerror = (e) => reject(new Error(e.error || "stt-error"));
    try {
      rec.start();
    } catch {
      reject(new Error("stt-start-failed"));
    }
  });
}
