import Notification from "../models/Notification.js";
import ConsultationSession from "../models/ConsultationSession.js";
import {
  NotificationType,
  NotificationStatus,
  ConsultationStatus,
} from "../constants.js";

function toPublic(n) {
  return {
    id: n._id,
    villager: n.villager,
    type: n.type,
    title: n.title,
    message: n.message,
    priority: n.priority,
    status: n.status,
    deliveryAddress: n.deliveryAddress,
    medicines: n.medicines,
    createdAt: n.createdAt,
    completedAt: n.completedAt,
  };
}

export async function getDeliveries(req, res) {
  try {
    const status = req.query.status;
    const filter = {
      ashaWorker: req.user.id,
      type: NotificationType.MEDICINE_DELIVERY,
    };
    if (status) {
      filter.status = status;
    }

    const deliveries = await Notification.find(filter)
      .populate("villager", "name village phone aadhaarLast4")
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .limit(100);

    const pending = await Notification.countDocuments({
      ashaWorker: req.user.id,
      type: NotificationType.MEDICINE_DELIVERY,
      status: { $ne: NotificationStatus.COMPLETED },
    });

    return res.json({ deliveries: deliveries.map(toPublic), pending });
  } catch {
    return res.status(500).json({ error: "Failed to load deliveries" });
  }
}

export async function getHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const deliveries = await Notification.find({
      ashaWorker: req.user.id,
      type: NotificationType.MEDICINE_DELIVERY,
      status: NotificationStatus.COMPLETED,
    })
      .populate("villager", "name village phone aadhaarLast4")
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(limit);

    const EmergencyAlert = (await import("../models/EmergencyAlert.js")).default;
    const alerts = await EmergencyAlert.find({
      ashaWorker: req.user.id,
      status: { $in: ["ACKNOWLEDGED", "RESOLVED"] },
    })
      .populate("villager", "name village phone")
      .sort({ resolvedAt: -1, acknowledgedAt: -1, createdAt: -1 })
      .limit(limit);

    return res.json({
      deliveries: deliveries.map(toPublic),
      emergencies: alerts.map((a) => ({
        id: a._id,
        villager: a.villager,
        village: a.village,
        transcript: a.transcript,
        summary: a.summary,
        category: a.category,
        severity: a.severity,
        patient: a.patient,
        location: a.location,
        status: a.status,
        createdAt: a.createdAt,
        acknowledgedAt: a.acknowledgedAt,
        resolvedAt: a.resolvedAt,
      })),
      totalDelivered: deliveries.length,
      totalEmergencies: alerts.length,
    });
  } catch {
    return res.status(500).json({ error: "Failed to load history" });
  }
}

export async function markDelivered(req, res) {
  try {
    const delivery = await Notification.findOne({
      _id: req.params.id,
      ashaWorker: req.user.id,
      type: NotificationType.MEDICINE_DELIVERY,
    });

    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    delivery.status = NotificationStatus.COMPLETED;
    delivery.completedAt = new Date();
    await delivery.save();

    if (delivery.session) {
      await ConsultationSession.findByIdAndUpdate(delivery.session, {
        status: ConsultationStatus.DISPENSED,
      });
    }

    return res.json({ delivery: toPublic(delivery) });
  } catch {
    return res.status(500).json({ error: "Failed to update delivery" });
  }
}
