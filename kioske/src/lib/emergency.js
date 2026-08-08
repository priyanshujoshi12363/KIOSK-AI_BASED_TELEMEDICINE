import { LLM_ENABLED } from "./aiConfig.js";

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const MODEL = import.meta.env.VITE_OLLAMA_MODEL || "gemma3n";

export const EmergencyCategory = {
  CARDIAC: "CARDIAC",
  BREATHING: "BREATHING",
  STROKE: "STROKE",
  UNCONSCIOUS: "UNCONSCIOUS",
  SEIZURE: "SEIZURE",
  POISONING: "POISONING",
  BLEEDING: "BLEEDING",
  CHILDBIRTH: "CHILDBIRTH",
  BURN: "BURN",
  INJURY: "INJURY",
  OTHER: "OTHER",
};

const CATEGORY_KEYWORDS = [
  [EmergencyCategory.CARDIAC, [
    "heart attack", "heartattack", "cardiac", "chest pain", "pain in chest", "heart",
    "दिल का दौरा", "हार्ट अटैक", "सीने में दर्द", "छाती में दर्द", "दिल",
    "હાર્ટ એટેક", "હૃદયરોગ", "છાતીમાં દુખાવો", "હૃદય",
  ]],
  [EmergencyCategory.BREATHING, [
    "not breathing", "cant breathe", "can't breathe", "cannot breathe", "no breath",
    "breathless", "shortness of breath", "choking", "asthma", "suffocat",
    "सांस नहीं", "साँस नहीं", "सांस लेने में", "साँस लेने में", "दम घुट", "अस्थमा",
    "શ્વાસ નથી", "શ્વાસ લેવામાં", "દમ", "શ્વાસ",
  ]],
  [EmergencyCategory.STROKE, [
    "stroke", "paralysis", "paralysed", "paralyzed", "face droop", "slurred",
    "लकवा", "स्ट्रोक", "मुँह टेढ़ा", "मुंह टेढ़ा",
    "લકવો", "સ્ટ્રોક", "પક્ષઘાત",
  ]],
  [EmergencyCategory.UNCONSCIOUS, [
    "unconscious", "fainted", "collapsed", "not waking", "passed out", "no response",
    "बेहोश", "होश नहीं", "गिर पड़ा", "गिर गया",
    "બેભાન", "બેહોશ", "ભાન નથી",
  ]],
  [EmergencyCategory.SEIZURE, [
    "seizure", "convulsion", "fits", "epilep",
    "दौरा", "मिर्गी", "झटके", "ऐंठन",
    "આંચકી", "વાઈ", "તાણ",
  ]],
  [EmergencyCategory.POISONING, [
    "poison", "snake bite", "snakebite", "overdose", "swallowed", "pesticide",
    "ज़हर", "जहर", "सांप ने काटा", "साँप", "विष", "कीटनाशक",
    "ઝેર", "સાપ કરડ્યો", "સાપ", "જંતુનાશક",
  ]],
  [EmergencyCategory.BLEEDING, [
    "bleeding", "heavy blood", "blood loss", "deep cut", "haemorrhage", "hemorrhage",
    "खून बह", "रक्तस्राव", "बहुत खून", "खून",
    "લોહી વહે", "રક્તસ્રાવ", "લોહી",
  ]],
  [EmergencyCategory.CHILDBIRTH, [
    "labour pain", "labor pain", "delivery", "giving birth", "pregnant", "baby coming",
    "प्रसव", "डिलीवरी", "गर्भवती", "बच्चा होने",
    "પ્રસૂતિ", "ગર્ભવતી", "ડિલિવરી",
  ]],
  [EmergencyCategory.BURN, [
    "burn", "burnt", "burned", "fire", "scald",
    "जल गया", "जल गयी", "आग", "जलन",
    "દાઝી", "દાઝ્યો", "આગ",
  ]],
  [EmergencyCategory.INJURY, [
    "accident", "fell down", "fell from", "fracture", "broken bone", "injured", "injury",
    "दुर्घटना", "एक्सीडेंट", "गिर", "हड्डी टूट", "चोट",
    "અકસ્માત", "પડી ગય", "હાડકું", "ઈજા",
  ]],
];

const CRITICAL = [
  EmergencyCategory.CARDIAC,
  EmergencyCategory.BREATHING,
  EmergencyCategory.STROKE,
  EmergencyCategory.UNCONSCIOUS,
  EmergencyCategory.SEIZURE,
  EmergencyCategory.POISONING,
];

const HIGH = [
  EmergencyCategory.BLEEDING,
  EmergencyCategory.CHILDBIRTH,
  EmergencyCategory.BURN,
  EmergencyCategory.INJURY,
];

const RELATIONS = [
  ["brother", ["brother", "भाई", "ભાઈ"]],
  ["sister", ["sister", "बहन", "બહેન"]],
  ["father", ["father", "dad", "पिता", "पापा", "बाप", "પિતા", "પપ્પા"]],
  ["mother", ["mother", "mom", "माँ", "मां", "माता", "મા", "માતા", "મમ્મી"]],
  ["son", ["son", "बेटा", "દીકરો"]],
  ["daughter", ["daughter", "बेटी", "દીકરી"]],
  ["wife", ["wife", "पत्नी", "પત્ની"]],
  ["husband", ["husband", "पति", "પતિ"]],
  ["child", ["child", "baby", "बच्चा", "बच्ची", "બાળક"]],
  ["neighbour", ["neighbour", "neighbor", "पड़ोसी", "પડોશી"]],
];

export function classifyEmergency(text) {
  const raw = (text || "").trim();
  const lower = raw.toLowerCase();

  const matched = [];
  let category = EmergencyCategory.OTHER;

  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    const hits = keywords.filter((k) => lower.includes(k.toLowerCase()));
    if (hits.length) {
      matched.push(...hits);
      if (category === EmergencyCategory.OTHER) category = cat;
    }
  }

  let severity = "MODERATE";
  if (CRITICAL.includes(category)) severity = "CRITICAL";
  else if (HIGH.includes(category)) severity = "HIGH";

  let patient = null;
  for (const [name, words] of RELATIONS) {
    if (words.some((w) => lower.includes(w.toLowerCase()))) {
      patient = name;
      break;
    }
  }

  return { category, severity, matched, patient, transcript: raw };
}

async function summarizeWithLLM(text) {
  const prompt =
    "A person at a rural emergency kiosk said: \"" + text + "\"\n" +
    "In one short English sentence (max 20 words), state who is affected and what the emergency is. " +
    "Do not diagnose. Do not add advice. Reply with the sentence only.";

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      keep_alive: "30m",
      options: { num_predict: 60, temperature: 0.2 },
    }),
  });

  const data = await res.json();
  return (data.response || "").trim();
}

export async function analyzeEmergency(text) {
  const result = classifyEmergency(text);

  if (!LLM_ENABLED) return result;

  try {
    const summary = await summarizeWithLLM(text);
    if (summary) return { ...result, summary };
  } catch {
    return result;
  }

  return result;
}
