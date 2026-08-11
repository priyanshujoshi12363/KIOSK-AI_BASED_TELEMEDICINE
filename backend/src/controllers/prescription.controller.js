import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";
import ConsultationSession from "../models/ConsultationSession.js";
import Notification from "../models/Notification.js";
import { workersForDuty } from "../services/ashaAssignment.js";
import {
  ConsultationStatus,
  PrescriptionStatus,
  NotificationType,
  NotificationPriority,
  Urgency,
  AshaDuty,
} from "../constants.js";

export async function getCatalog(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const filter = { inStock: true };
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }
    const medicines = await Medicine.find(filter).sort({ name: 1 }).limit(50);
    return res.json({ medicines });
  } catch {
    return res.status(500).json({ error: "Failed to load catalog" });
  }
}

function normaliseItems(medicines) {
  return (Array.isArray(medicines) ? medicines : [])
    .filter((m) => m && String(m.name || "").trim())
    .map((m) => ({
      name: String(m.name).trim(),
      dosage: String(m.dosage || "").trim(),
      frequency: String(m.frequency || "").trim(),
      timing: String(m.timing || "").trim(),
      duration: String(m.duration || "").trim(),
      quantity: Number(m.quantity) || 1,
      instructions: String(m.instructions || "").trim(),
    }));
}

function toPublicRx(rx) {
  return {
    id: rx._id,
    session: rx.session,
    villager: rx.villager,
    doctor: rx.doctor,
    medicines: rx.medicines,
    advice: rx.advice,
    diagnosis: rx.diagnosis,
    keyPoints: rx.keyPoints,
    followUp: rx.followUp,
    transcript: rx.transcript,
    source: rx.source,
    status: rx.status,
    confirmedAt: rx.confirmedAt,
    createdAt: rx.createdAt,
  };
}

export async function createDraftFromCall(req, res) {
  try {
    const { sessionId, medicines, advice, diagnosis, keyPoints, followUp, transcript } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await ConsultationSession.findById(sessionId).populate(
      "villager",
      "name address village"
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const items = normaliseItems(medicines);

    const existing = await Prescription.findOne({
      session: session._id,
      status: PrescriptionStatus.DRAFT,
    });

    const payload = {
      medicines: items,
      advice: String(advice || "").trim(),
      diagnosis: String(diagnosis || "").trim(),
      keyPoints: Array.isArray(keyPoints) ? keyPoints.map(String) : [],
      followUp: String(followUp || "").trim(),
      transcript: String(transcript || "").trim(),
      source: "ai-consult",
      status: PrescriptionStatus.DRAFT,
    };

    let prescription;
    if (existing) {
      Object.assign(existing, payload);
      prescription = await existing.save();
    } else {
      prescription = await Prescription.create({
        ...payload,
        session: session._id,
        villager: session.villager._id,
        doctor: session.doctor,
      });
    }

    if (!session.prescription) {
      session.prescription = prescription._id;
      await session.save();
    }

    return res.status(201).json({ prescription: toPublicRx(prescription) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save draft" });
  }
}

export async function getSessionPrescription(req, res) {
  try {
    const prescription = await Prescription.findOne({ session: req.params.sessionId })
      .sort({ createdAt: -1 })
      .populate("villager", "name village address phone aadhaarLast4 gender dateOfBirth")
      .populate("doctor", "name specialization");

    if (!prescription) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ prescription: toPublicRx(prescription), full: prescription });
  } catch {
    return res.status(500).json({ error: "Failed to load prescription" });
  }
}

export async function getDraft(req, res) {
  try {
    const prescription = await Prescription.findOne({
      session: req.params.sessionId,
      status: PrescriptionStatus.DRAFT,
    }).populate("villager", "name village address phone");

    if (!prescription) {
      return res.status(404).json({ error: "No draft yet" });
    }
    return res.json({ prescription: toPublicRx(prescription) });
  } catch {
    return res.status(500).json({ error: "Failed to load draft" });
  }
}

export async function confirmPrescription(req, res) {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: "Not found" });
    }

    const session = await ConsultationSession.findById(prescription.session).populate(
      "villager",
      "name address village"
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.doctor && String(session.doctor) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not your consultation" });
    }

    if (Array.isArray(req.body.medicines)) {
      prescription.medicines = normaliseItems(req.body.medicines);
    }
    if (typeof req.body.advice === "string") prescription.advice = req.body.advice.trim();
    if (typeof req.body.diagnosis === "string") prescription.diagnosis = req.body.diagnosis.trim();
    if (typeof req.body.followUp === "string") prescription.followUp = req.body.followUp.trim();

    if (!prescription.medicines.length) {
      return res.status(400).json({ error: "At least one medicine is required" });
    }

    prescription.doctor = req.user.id;
    prescription.status = PrescriptionStatus.CONFIRMED;
    prescription.confirmedAt = new Date();
    await prescription.save();

    session.status = ConsultationStatus.PRESCRIBED;
    session.prescription = prescription._id;
    session.doctor = req.user.id;
    session.consultEndedAt = session.consultEndedAt || new Date();
    await session.save();

    const deliveryWorkers = await workersForDuty(AshaDuty.DELIVERY);
    const priority =
      session.urgency === Urgency.EMERGENCY
        ? NotificationPriority.URGENT
        : NotificationPriority.NORMAL;

    await Notification.insertMany(
      deliveryWorkers.map((ashaId) => ({
        ashaWorker: ashaId,
        villager: session.villager._id,
        session: session._id,
        prescription: prescription._id,
        type: NotificationType.MEDICINE_DELIVERY,
        title: `Medicine delivery for ${session.villager.name}`,
        message: `Deliver prescribed medicines to ${session.villager.name}, ${session.villager.village}.`,
        priority,
        deliveryAddress: session.villager.address,
        medicines: prescription.medicines,
        location: session.location,
      }))
    );
    const notified = deliveryWorkers.length > 0;

    return res.json({ prescription: toPublicRx(prescription), notified });
  } catch (err) {
    return res.status(500).json({ error: "Failed to confirm prescription" });
  }
}

export async function createPrescription(req, res) {
  try {
    const { sessionId, medicines, advice } = req.body;

    if (!sessionId || !Array.isArray(medicines) || medicines.length === 0) {
      return res
        .status(400)
        .json({ error: "sessionId and at least one medicine are required" });
    }

    const session = await ConsultationSession.findById(sessionId).populate(
      "villager",
      "name address village assignedAshaWorker"
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (String(session.doctor) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not your consultation" });
    }

    const items = normaliseItems(medicines);
    if (!items.length) {
      return res.status(400).json({ error: "At least one medicine is required" });
    }

    const prescription = await Prescription.create({
      session: session._id,
      villager: session.villager._id,
      doctor: req.user.id,
      medicines: items,
      advice: advice || "",
      source: req.body.source || "manual",
      status: PrescriptionStatus.CONFIRMED,
      confirmedAt: new Date(),
    });

    session.status = ConsultationStatus.PRESCRIBED;
    session.prescription = prescription._id;
    session.consultEndedAt = new Date();
    await session.save();

    const deliveryWorkers = await workersForDuty(AshaDuty.DELIVERY);
    const priority =
      session.urgency === Urgency.EMERGENCY
        ? NotificationPriority.URGENT
        : NotificationPriority.NORMAL;

    await Notification.insertMany(
      deliveryWorkers.map((ashaId) => ({
        ashaWorker: ashaId,
        villager: session.villager._id,
        session: session._id,
        prescription: prescription._id,
        type: NotificationType.MEDICINE_DELIVERY,
        title: `Medicine delivery for ${session.villager.name}`,
        message: `Deliver prescribed medicines to ${session.villager.name}, ${session.villager.village}.`,
        priority,
        deliveryAddress: session.villager.address,
        medicines: items,
        location: session.location,
      }))
    );
    const notified = deliveryWorkers.length > 0;

    return res.status(201).json({ prescription, notified });
  } catch {
    return res.status(500).json({ error: "Failed to create prescription" });
  }
}
