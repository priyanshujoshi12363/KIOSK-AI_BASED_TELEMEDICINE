import ConsultationSession from "../models/ConsultationSession.js";
import Villager from "../models/Villager.js";
import { ConsultationStatus, Urgency } from "../constants.js";

const PICKUP_HOURS = 2;

function toPublic(s) {
  return {
    id: s._id,
    villager: s.villager,
    village: s.village,
    symptoms: s.symptoms,
    language: s.language,
    redFlags: s.redFlags,
    urgency: s.urgency,
    status: s.status,
    doctor: s.doctor,
    assignedAshaWorker: s.assignedAshaWorker,
    prescription: s.prescription,
    pickupAfter: s.pickupAfter,
    createdAt: s.createdAt,
  };
}

export async function createSession(req, res) {
  try {
    const { villagerId, symptoms, language, redFlags, location } = req.body;

    if (!villagerId) {
      return res.status(400).json({ error: "villagerId is required" });
    }

    const villager = await Villager.findById(villagerId);
    if (!villager) {
      return res.status(404).json({ error: "Villager not found" });
    }

    const urgency =
      Array.isArray(redFlags) && redFlags.length ? Urgency.EMERGENCY : Urgency.NORMAL;

    const pickupAfter = new Date(Date.now() + PICKUP_HOURS * 60 * 60 * 1000);

    const session = await ConsultationSession.create({
      villager: villager._id,
      village: villager.village,
      symptoms: symptoms || "",
      language: language || "hi",
      redFlags: Array.isArray(redFlags) ? redFlags : [],
      urgency,
      status: ConsultationStatus.QUEUED,
      assignedAshaWorker: villager.assignedAshaWorker,
      location:
        location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))
          ? {
              lat: Number(location.lat),
              lng: Number(location.lng),
              accuracy: Number(location.accuracy) || undefined,
              label: location.label,
              source: location.source,
            }
          : undefined,
      pickupAfter,
    });

    return res.status(201).json({
      session: toPublic(session),
      pickupAfterHours: PICKUP_HOURS,
    });
  } catch {
    return res.status(500).json({ error: "Failed to create session" });
  }
}

export async function getQueue(req, res) {
  try {
    const sessions = await ConsultationSession.find({
      status: ConsultationStatus.QUEUED,
    })
      .populate("villager", "name village phone aadhaarLast4 gender dateOfBirth")
      .sort({ urgency: -1, createdAt: 1 })
      .limit(50);

    return res.json({ sessions: sessions.map(toPublic) });
  } catch {
    return res.status(500).json({ error: "Failed to load queue" });
  }
}

export async function claimSession(req, res) {
  try {
    const session = await ConsultationSession.findOneAndUpdate(
      { _id: req.params.id, status: ConsultationStatus.QUEUED },
      {
        status: ConsultationStatus.IN_CONSULT,
        doctor: req.user.id,
        consultStartedAt: new Date(),
      },
      { new: true }
    ).populate("villager", "name village phone aadhaarLast4 gender dateOfBirth address");

    if (!session) {
      return res.status(409).json({ error: "Session already taken or not found" });
    }

    return res.json({ session: toPublic(session) });
  } catch {
    return res.status(500).json({ error: "Failed to claim session" });
  }
}

export async function getSession(req, res) {
  try {
    const session = await ConsultationSession.findById(req.params.id)
      .populate("villager", "name village phone aadhaarLast4 gender dateOfBirth address")
      .populate("doctor", "name specialization")
      .populate("prescription");

    if (!session) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ session: toPublic(session) });
  } catch {
    return res.status(500).json({ error: "Failed to load session" });
  }
}

export async function getDoctorHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const sessions = await ConsultationSession.find({
      doctor: req.user.id,
      status: { $in: [ConsultationStatus.PRESCRIBED, ConsultationStatus.DISPENSED] },
    })
      .populate("villager", "name village phone aadhaarLast4 gender dateOfBirth")
      .populate("prescription", "medicines diagnosis advice status confirmedAt")
      .sort({ consultEndedAt: -1, createdAt: -1 })
      .limit(limit);

    const items = sessions.map((s) => ({
      id: s._id,
      villager: s.villager,
      village: s.village,
      symptoms: s.symptoms,
      urgency: s.urgency,
      status: s.status,
      consultEndedAt: s.consultEndedAt,
      createdAt: s.createdAt,
      diagnosis: s.prescription?.diagnosis || "",
      medicines: s.prescription?.medicines || [],
      advice: s.prescription?.advice || "",
    }));

    const dispensed = items.filter((i) => i.status === ConsultationStatus.DISPENSED).length;

    return res.json({ sessions: items, total: items.length, dispensed });
  } catch {
    return res.status(500).json({ error: "Failed to load history" });
  }
}

export async function endSession(req, res) {
  try {
    const session = await ConsultationSession.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      { consultEndedAt: new Date() },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ session: toPublic(session) });
  } catch {
    return res.status(500).json({ error: "Failed to end session" });
  }
}
