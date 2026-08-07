import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";
import ConsultationSession from "../models/ConsultationSession.js";
import Notification from "../models/Notification.js";
import {
  ConsultationStatus,
  PrescriptionStatus,
  NotificationType,
  NotificationPriority,
  Urgency,
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

    const items = medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage || "",
      quantity: Number(m.quantity) || 1,
      instructions: m.instructions || "",
    }));

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

    let notified = false;
    if (session.assignedAshaWorker) {
      const priority =
        session.urgency === Urgency.EMERGENCY
          ? NotificationPriority.URGENT
          : NotificationPriority.NORMAL;

      await Notification.create({
        ashaWorker: session.assignedAshaWorker,
        villager: session.villager._id,
        session: session._id,
        prescription: prescription._id,
        type: NotificationType.MEDICINE_DELIVERY,
        title: `Medicine delivery for ${session.villager.name}`,
        message: `Deliver prescribed medicines to ${session.villager.name}, ${session.villager.village}.`,
        priority,
        deliveryAddress: session.villager.address,
        medicines: items,
      });
      notified = true;
    }

    return res.status(201).json({ prescription, notified });
  } catch {
    return res.status(500).json({ error: "Failed to create prescription" });
  }
}
