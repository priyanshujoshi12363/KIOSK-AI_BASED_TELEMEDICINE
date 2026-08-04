import Villager from "../models/Villager.js";

const THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.35);

function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

export async function identifyByEmbedding(probe) {
  const villagers = await Villager.find({
    isActive: true,
    faceRegistered: true,
  }).select("+faceEmbedding");

  let best = null;
  let bestScore = -1;

  for (const v of villagers) {
    if (!v.faceEmbedding || v.faceEmbedding.length !== probe.length) {
      continue;
    }
    const score = cosineSimilarity(probe, v.faceEmbedding);
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }

  if (best && bestScore >= THRESHOLD) {
    return { villager: best, score: bestScore };
  }
  return null;
}
