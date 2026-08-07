import { createContext, useContext, useState, useCallback } from "react";
import { t as translations } from "../i18n.js";

const KioskContext = createContext(null);

export const STEPS = ["SPLASH", "WELCOME", "SCAN", "AGENT", "CONSULT", "DONE"];

export function KioskProvider({ children }) {
  const [lang, setLang] = useState("hi");
  const [step, setStep] = useState("SPLASH");
  const [villager, setVillager] = useState(null);
  const [symptoms, setSymptoms] = useState("");

  const go = useCallback((next) => setStep(next), []);

  const reset = useCallback(() => {
    setStep("SPLASH");
    setVillager(null);
    setSymptoms("");
    setLang("hi");
  }, []);

  const value = {
    lang,
    setLang,
    step,
    go,
    villager,
    setVillager,
    symptoms,
    setSymptoms,
    reset,
    t: translations[lang],
  };

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}

export function useKiosk() {
  return useContext(KioskContext);
}
