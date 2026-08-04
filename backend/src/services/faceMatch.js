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
  }).select("+faceEmbedding +faceEmbeddings");

  let best = null;
  let bestScore = -1;

  for (const v of villagers) {
    const vectors = [];
    if (Array.isArray(v.faceEmbeddings)) {
      vectors.push(...v.faceEmbeddings);
    }
    if (Array.isArray(v.faceEmbedding) && v.faceEmbedding.length) {
      vectors.push(v.faceEmbedding);
    }

    for (const vec of vectors) {
      if (!vec || vec.length !== probe.length) {
        continue;
      }
      const score = cosineSimilarity(probe, vec);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
  }

  const matched = !!best && bestScore >= THRESHOLD;
  return { villager: matched ? best : null, score: bestScore, matched };
}
