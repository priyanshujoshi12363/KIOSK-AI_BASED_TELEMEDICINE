import Villager from "../models/Villager.js";
import {
  isValidAadhaar,
  hashAadhaar,
  aadhaarLast4,
} from "../utils/aadhaar.js";
import { getFaceEmbedding } from "../services/aiClient.js";
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
    } = req.body;

    if (!name || !aadhaarNumber || !village || !address) {
      return res
        .status(400)
        .json({ error: "name, aadhaarNumber, village and address are required" });
    }

    if (!isValidAadhaar(aadhaarNumber)) {
      return res.status(400).json({ error: "aadhaarNumber must be 12 digits" });
    }

    if (!faceImage) {
      return res.status(400).json({ error: "faceImage is required" });
    }

    const aadhaarHash = hashAadhaar(aadhaarNumber);
    const existing = await Villager.findOne({ aadhaarHash });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Villager already registered with this Aadhaar" });
    }

    let faceEmbedding;
    try {
      faceEmbedding = await getFaceEmbedding(faceImage);
    } catch (err) {
      return res.status(400).json({ error: `Face capture failed: ${err.message}` });
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
      faceEmbedding,
      faceRegistered: true,
      assignedAshaWorker,
    });

    return res.status(201).json({ villager: toPublic(villager) });
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
      probe = await getFaceEmbedding(faceImage);
    } catch (err) {
      return res.status(400).json({ error: `Face capture failed: ${err.message}` });
    }

    const match = await identifyByEmbedding(probe);
    if (!match) {
      return res.status(404).json({ identified: false });
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
