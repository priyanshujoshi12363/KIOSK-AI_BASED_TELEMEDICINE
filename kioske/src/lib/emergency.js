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
    "dil ka daura", "seene mein dard", "chhati mein dard", "heart ka problem"]],
  [EmergencyCategory.BREATHING, [
    "not breathing", "cant breathe", "can't breathe", "cannot breathe", "no breath",
    "breathless", "shortness of breath", "choking", "asthma", "suffocat",
    "सांस नहीं", "साँस नहीं", "सांस लेने में", "साँस लेने में", "दम घुट", "अस्थमा",
    "શ્વાસ નથી", "શ્વાસ લેવામાં", "દમ", "શ્વાસ",
    "saans nahi", "saans lene", "dam ghut", "shwas"]],
  [EmergencyCategory.STROKE, [
    "stroke", "paralysis", "paralysed", "paralyzed", "face droop", "slurred",
    "लकवा", "स्ट्रोक", "मुँह टेढ़ा", "मुंह टेढ़ा",
    "લકવો", "સ્ટ્રોક", "પક્ષઘાત",
    "lakwa", "palsy"]],
  [EmergencyCategory.UNCONSCIOUS, [
    "unconscious", "fainted", "collapsed", "not waking", "passed out", "no response",
    "बेहोश", "होश नहीं", "गिर पड़ा", "गिर गया",
    "બેભાન", "બેહોશ", "ભાન નથી",
    "behosh", "hosh nahi", "gir gaya"]],
  [EmergencyCategory.SEIZURE, [
    "seizure", "convulsion", "fits", "epilep",
    "दौरा", "मिर्गी", "झटके", "ऐंठन",
    "આંચકી", "વાઈ", "તાણ",
    "mirgi", "daura", "jhatke"]],
  [EmergencyCategory.POISONING, [
    "poison", "snake bite", "snakebite", "overdose", "swallowed", "pesticide",
    "ज़हर", "जहर", "सांप ने काटा", "साँप", "विष", "कीटनाशक",
    "ઝેર", "સાપ કરડ્યો", "સાપ", "જંતુનાશક",
    "saap", "saanp", "zeher", "jahar", "kaat liya"]],
  [EmergencyCategory.BLEEDING, [
    "bleeding", "heavy blood", "blood loss", "deep cut", "haemorrhage", "hemorrhage",
    "खून बह", "रक्तस्राव", "बहुत खून", "खून",
    "લોહી વહે", "રક્તસ્રાવ", "લોહી",
    "khoon", "khun beh"]],
  [EmergencyCategory.CHILDBIRTH, [
    "labour pain", "labor pain", "delivery", "giving birth", "pregnant", "baby coming",
    "प्रसव", "डिलीवरी", "गर्भवती", "बच्चा होने",
    "પ્રસૂતિ", "ગર્ભવતી", "ડિલિવરી",
    "prasav", "garbhvati", "bachcha ho"]],
  [EmergencyCategory.BURN, [
    "burn", "burnt", "burned", "fire", "scald",
    "जल गया", "जल गयी", "आग", "जलन",
    "દાઝી", "દાઝ્યો", "આગ",
    "jal gaya", "jal gayi"]],
  [EmergencyCategory.INJURY, [
    "accident", "fell down", "fell from", "fracture", "broken bone", "injured", "injury",
    "दुर्घटना", "एक्सीडेंट", "गिर", "हड्डी टूट", "चोट",
    "અકસ્માત", "પડી ગય", "હાડકું", "ઈજા",
    "chot lag", "haddi tut", "gir pada"]],
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
  ["brother", ["brother", "भाई", "ભાઈ", "bhai", "bhaiya"]],
  ["sister", ["sister", "बहन", "બહેન", "behen", "bahan"]],
  ["father", ["father", "dad", "पिता", "पापा", "बाप", "પિતા", "પપ્પા", "pita", "papa", "pitaji"]],
  ["mother", ["mother", "mom", "माँ", "मां", "माता", "મા", "માતા", "મમ્મી", "maa", "mummy", "mataji"]],
  ["son", ["son", "बेटा", "દીકરો", "beta"]],
  ["daughter", ["daughter", "बेटी", "દીકરી", "beti"]],
  ["wife", ["wife", "पत्नी", "પત્ની", "patni"]],
  ["husband", ["husband", "पति", "પતિ", "pati"]],
  ["child", ["child", "baby", "बच्चा", "बच्ची", "બાળક", "bachcha", "bachchi"]],
  ["neighbour", ["neighbour", "neighbor", "पड़ोसी", "પડોશી"]],
];

const SEPARATOR = "\\s,.!?;:\"'()\\-–—।";

function hasKeyword(haystack, keyword) {
  const needle = keyword.toLowerCase();
  if (!needle) return false;

  if (needle.length > 3) return haystack.includes(needle);

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[${SEPARATOR}])${escaped}($|[${SEPARATOR}])`, "u").test(haystack);
}

export function classifyEmergency(text) {
  const raw = (text || "").trim();
  const lower = raw.toLowerCase();

  const matched = [];
  let category = EmergencyCategory.OTHER;

  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    const hits = keywords.filter((k) => hasKeyword(lower, k));
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
    if (words.some((w) => hasKeyword(lower, w))) {
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
