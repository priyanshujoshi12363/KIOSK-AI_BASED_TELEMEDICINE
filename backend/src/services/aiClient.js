const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function getFaceEmbedding(imageBase64) {
  const res = await fetch(`${AI_SERVICE_URL}/face/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || "face_embedding_failed");
    err.status = res.status;
    throw err;
  }

  return data.embedding;
}

export async function getBestFaceEmbedding(imageBase64) {
  const res = await fetch(`${AI_SERVICE_URL}/face/embed-best`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || "face_embedding_failed");
    err.status = res.status;
    throw err;
  }

  return { faces: data.faces || 0, embedding: data.embedding || null };
}
