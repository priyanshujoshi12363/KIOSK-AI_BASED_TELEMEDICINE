import Villager from "../models/Villager.js";
import {
  isValidAadhaar,
  hashAadhaar,
  aadhaarLast4,
} from "../utils/aadhaar.js";
import { getFaceEmbedding, getBestFaceEmbedding } from "../services/aiClient.js";
import { assignAshaForVillage } from "../services/ashaAssignment.js";
import { identifyByEmbedding } from "../services/faceMatch.js";

function toPublic(v) {
  return {
    id: v._id,
    name: v.name,
    gender: v.gender,
    dateOfBirth: v.dateOfBirth,
    phone: v.phone,
    village: v.village,
    address: v.address,
    aadhaarLast4: v.aadhaarLast4,
    abhaId: v.abhaId,
    faceRegistered: v.faceRegistered,
    faceCount: Array.isArray(v.faceEmbeddings) ? v.faceEmbeddings.length : v.faceEmbedding ? 1 : 0,
    assignedAshaWorker: v.assignedAshaWorker,
    isActive: v.isActive,
    createdAt: v.createdAt,
  };
}

export async function registerVillager(req, res) {
  try {
    const {
      name,
      aadhaarNumber,
      dateOfBirth,
      gender,
      phone,
      village,
      address,
      abhaId,
      faceImage,
      faceImages,
    } = req.body;

    if (!name || !aadhaarNumber || !village || !address) {
      return res
        .status(400)
        .json({ error: "name, aadhaarNumber, village and address are required" });
    }

    if (!isValidAadhaar(aadhaarNumber)) {
      return res.status(400).json({ error: "aadhaarNumber must be 12 digits" });
    }

    const images = Array.isArray(faceImages) && faceImages.length
      ? faceImages
      : faceImage
        ? [faceImage]
        : [];

    const aadhaarHash = hashAadhaar(aadhaarNumber);
    const existing = await Villager.findOne({ aadhaarHash });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Villager already registered with this Aadhaar" });
    }

    const faceEmbeddings = [];
    let faceError = null;

    for (let i = 0; i < images.length; i++) {
      try {
        const embedding = await getFaceEmbedding(images[i]);
        faceEmbeddings.push(embedding);
      } catch (err) {
        faceError = `Face capture failed on image ${i + 1}: ${err.message}`;
        break;
      }
    }

    const assignedAshaWorker = await assignAshaForVillage(village);

    const villager = await Villager.create({
      name,
      dateOfBirth,
      gender,
      phone,
      village,
      address,
      abhaId,
      aadhaarHash,
      aadhaarLast4: aadhaarLast4(aadhaarNumber),
      faceEmbeddings,
      faceRegistered: faceEmbeddings.length > 0,
      assignedAshaWorker,
    });

    return res.status(201).json({
      villager: toPublic(villager),
      faceEnrolled: faceEmbeddings.length > 0,
      faceError,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "Villager already registered with this Aadhaar" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function identifyVillager(req, res) {
  try {
    const { faceImage } = req.body;

    if (!faceImage) {
      return res.status(400).json({ error: "faceImage is required" });
    }

    let probe;
    try {
      probe = await getBestFaceEmbedding(faceImage);
    } catch {
      return res.json({ identified: false, reason: "service_unavailable" });
    }

    if (!probe.embedding || probe.faces === 0) {
      return res.json({ identified: false, reason: "no_face" });
    }

    const match = await identifyByEmbedding(probe.embedding);
    if (!match.matched) {
      return res.json({ identified: false, reason: "no_match", score: match.score });
    }

    return res.json({
      identified: true,
      score: match.score,
      villager: toPublic(match.villager),
    });
  } catch {
    return res.status(500).json({ error: "Identification failed" });
  }
}

export async function getVillager(req, res) {
  try {
    const villager = await Villager.findById(req.params.id).populate(
      "assignedAshaWorker",
      "name phone village"
    );
    if (!villager) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ villager: toPublic(villager) });
  } catch {
    return res.status(500).json({ error: "Failed to load villager" });
  }
}
