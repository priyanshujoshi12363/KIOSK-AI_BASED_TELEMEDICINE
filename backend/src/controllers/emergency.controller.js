import EmergencyAlert from "../models/EmergencyAlert.js";
import AshaWorker from "../models/AshaWorker.js";
import Villager from "../models/Villager.js";
import Notification from "../models/Notification.js";
import { triage, CategoryLabel } from "../services/emergencyTriage.js";
import { getIO } from "../signaling.js";
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  EmergencySeverity,
  EmergencyStatus,
} from "../constants.js";

function toPublic(a) {
  return {
    id: a._id,
    villager: a.villager,
    village: a.village,
    transcript: a.transcript,
    summary: a.summary,
    language: a.language,
    category: a.category,
    categoryLabel: CategoryLabel[a.category] || CategoryLabel.OTHER,
    severity: a.severity,
    patient: a.patient,
    location: a.location,
    status: a.status,
    createdAt: a.createdAt,
    acknowledgedAt: a.acknowledgedAt,
  };
}

function cleanLocation(loc) {
  if (!loc || typeof loc !== "object") return undefined;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return {
    lat,
    lng,
    accuracy: Number.isFinite(Number(loc.accuracy)) ? Number(loc.accuracy) : undefined,
    label: typeof loc.label === "string" ? loc.label : undefined,
    source: typeof loc.source === "string" ? loc.source : undefined,
  };
}

async function resolveAshaWorkers(villagerDoc, village) {
  if (villagerDoc?.assignedAshaWorker) {
    return [villagerDoc.assignedAshaWorker];
  }

  if (village) {
    const inVillage = await AshaWorker.find({ village, isActive: true }).select("_id");
    if (inVillage.length) return inVillage.map((a) => a._id);
  }

  const anyActive = await AshaWorker.find({ isActive: true }).select("_id").limit(20);
  return anyActive.map((a) => a._id);
}

export async function createEmergency(req, res) {
  try {
    const { transcript, language, summary, villagerId, village, location } = req.body;

    const text = (transcript || "").trim();
    if (!text) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const assessment = triage(text);

    let villagerDoc = null;
    if (villagerId) {
      villagerDoc = await Villager.findById(villagerId).select(
        "name village address phone assignedAshaWorker"
      );
    }

    const resolvedVillage = villagerDoc?.village || village || "";
    const ashaIds = await resolveAshaWorkers(villagerDoc, resolvedVillage);

    const alert = await EmergencyAlert.create({
      villager: villagerDoc?._id,
      ashaWorker: ashaIds[0],
      village: resolvedVillage,
      transcript: text,
      summary: (summary || "").trim(),
      language: language || "hi",
      category: assessment.category,
      severity: assessment.severity,
      patient: assessment.patient,
      matched: assessment.matched,
      location: cleanLocation(location),
      status: EmergencyStatus.OPEN,
    });

    const label = CategoryLabel[assessment.category] || CategoryLabel.OTHER;
    const who = villagerDoc?.name || (assessment.patient ? `patient's ${assessment.patient}` : "Someone");
    const placeParts = [resolvedVillage, alert.location?.label].filter(Boolean);
    const place = placeParts.length ? placeParts.join(", ") : "kiosk location";

    const title = `EMERGENCY · ${label}`;
    const message =
      `${who} needs help at ${place}. ` +
      `Reported: "${text}"` +
      (alert.location ? ` Location: ${alert.location.lat.toFixed(5)}, ${alert.location.lng.toFixed(5)}.` : "");

    const priority =
      assessment.severity === EmergencySeverity.MODERATE
        ? NotificationPriority.HIGH
        : NotificationPriority.URGENT;

    const notifications = await Notification.insertMany(
      ashaIds.map((ashaId) => ({
        ashaWorker: ashaId,
        villager: villagerDoc?._id,
        emergency: alert._id,
        type: NotificationType.EMERGENCY_ALERT,
        title,
        message,
        priority,
        status: NotificationStatus.UNREAD,
        deliveryAddress: villagerDoc?.address || alert.location?.label || resolvedVillage,
        location: alert.location,
      }))
    );

    const io = getIO();
    if (io) {
      const payload = toPublic(alert);
      ashaIds.forEach((ashaId) => {
        io.to(`asha:${ashaId}`).emit("emergency", payload);
      });
      io.emit("emergency-broadcast", payload);
    }

    return res.status(201).json({
      alert: toPublic(alert),
      notified: notifications.length,
    });
  } catch {
    return res.status(500).json({ error: "Failed to raise emergency" });
  }
}

export async function getEmergencies(req, res) {
  try {
    const worker = await AshaWorker.findById(req.user.id).select("village");
    const conditions = [{ ashaWorker: req.user.id }, { ashaWorker: null }];
    if (worker?.village) {
      conditions.push({ village: worker.village });
    }

    const filter = { $or: conditions };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const alerts = await EmergencyAlert.find(filter)
      .populate("villager", "name village phone aadhaarLast4")
      .sort({ status: 1, createdAt: -1 })
      .limit(50);

    const open = await EmergencyAlert.countDocuments({
      $or: conditions,
      status: EmergencyStatus.OPEN,
    });

    return res.json({ alerts: alerts.map(toPublic), open });
  } catch {
    return res.status(500).json({ error: "Failed to load emergencies" });
  }
}

export async function acknowledgeEmergency(req, res) {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: EmergencyStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        ashaWorker: req.user.id,
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await Notification.updateMany(
      { emergency: alert._id, ashaWorker: req.user.id },
      { status: NotificationStatus.ACKNOWLEDGED, readAt: new Date() }
    );

    return res.json({ alert: toPublic(alert) });
  } catch {
    return res.status(500).json({ error: "Failed to acknowledge" });
  }
}

export async function resolveEmergency(req, res) {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: EmergencyStatus.RESOLVED, resolvedAt: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await Notification.updateMany(
      { emergency: alert._id, ashaWorker: req.user.id },
      { status: NotificationStatus.COMPLETED, completedAt: new Date() }
    );

    return res.json({ alert: toPublic(alert) });
  } catch {
    return res.status(500).json({ error: "Failed to resolve" });
  }
}
