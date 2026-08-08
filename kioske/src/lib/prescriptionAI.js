import { askAgentRaw } from "./ai.js";

const SYSTEM = `You read a transcript of a tele-medicine video consultation between a doctor and a patient in rural India.
Extract ONLY what the doctor actually said. Never invent a medicine, dose or instruction.
Reply with strict JSON and nothing else, in this shape:
{
  "diagnosis": "short line, or empty string",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. 1-0-1 or twice a day",
      "timing": "e.g. after food",
      "duration": "e.g. 5 days",
      "quantity": 10,
      "instructions": "any extra note"
    }
  ],
  "advice": "lifestyle or care advice the doctor gave",
  "followUp": "when to come back, or empty string",
  "keyPoints": ["short bullet of each important thing the doctor said"]
}
If the doctor prescribed no medicine, return an empty medicines array.
Use plain English for field values even if the consultation was in another language.`;

function extractJSON(text) {
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function coerce(parsed, transcript) {
  const medicines = Array.isArray(parsed?.medicines) ? parsed.medicines : [];

  return {
    diagnosis: String(parsed?.diagnosis || "").trim(),
    advice: String(parsed?.advice || "").trim(),
    followUp: String(parsed?.followUp || "").trim(),
    keyPoints: Array.isArray(parsed?.keyPoints)
      ? parsed.keyPoints.map((k) => String(k).trim()).filter(Boolean)
      : [],
    medicines: medicines
      .filter((m) => m && String(m.name || "").trim())
      .map((m) => ({
        name: String(m.name).trim(),
        dosage: String(m.dosage || "").trim(),
        frequency: String(m.frequency || "").trim(),
        timing: String(m.timing || "").trim(),
        duration: String(m.duration || "").trim(),
        quantity: Number(m.quantity) > 0 ? Math.round(Number(m.quantity)) : 1,
        instructions: String(m.instructions || "").trim(),
      })),
    transcript,
  };
}

export async function extractPrescription(transcript) {
  const text = (transcript || "").trim();
  if (!text) {
    return { diagnosis: "", medicines: [], advice: "", followUp: "", keyPoints: [], transcript: "" };
  }

  const reply = await askAgentRaw({
    system: SYSTEM,
    messages: [{ role: "user", content: `Consultation transcript:\n\n${text}` }],
  });

  const parsed = extractJSON(reply);
  if (!parsed) {
    return {
      diagnosis: "",
      medicines: [],
      advice: "",
      followUp: "",
      keyPoints: text
        .split(/[.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 12)
        .slice(0, 6),
      transcript: text,
    };
  }

  return coerce(parsed, text);
}
