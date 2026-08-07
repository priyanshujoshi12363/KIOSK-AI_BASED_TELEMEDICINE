import mongoose from "mongoose";
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from "../constants.js";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    quantity: { type: Number, default: 1 },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    ashaWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AshaWorker",
      required: true,
    },
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villager",
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationSession",
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.GENERAL,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
    readAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ ashaWorker: 1, status: 1 });
notificationSchema.index({ villager: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
