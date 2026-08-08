import mongoose from "mongoose";
import { ConsultationStatus, Urgency } from "../constants.js";

const consultationSessionSchema = new mongoose.Schema(
  {
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villager",
      required: true,
    },
    village: {
      type: String,
      trim: true,
    },
    symptoms: {
      type: String,
      default: "",
      trim: true,
    },
    language: {
      type: String,
      default: "hi",
    },
    redFlags: {
      type: [String],
      default: [],
    },
    urgency: {
      type: String,
      enum: Object.values(Urgency),
      default: Urgency.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(ConsultationStatus),
      default: ConsultationStatus.QUEUED,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    assignedAshaWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AshaWorker",
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    location: {
      type: new mongoose.Schema(
        {
          lat: { type: Number },
          lng: { type: Number },
          accuracy: { type: Number },
          label: { type: String, trim: true },
          source: { type: String, trim: true },
        },
        { _id: false }
      ),
    },
    pickupAfter: {
      type: Date,
    },
    consultStartedAt: {
      type: Date,
    },
    consultEndedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

consultationSessionSchema.index({ status: 1, urgency: 1, createdAt: 1 });
consultationSessionSchema.index({ doctor: 1, status: 1 });
consultationSessionSchema.index({ assignedAshaWorker: 1, status: 1 });

const ConsultationSession = mongoose.model(
  "ConsultationSession",
  consultationSessionSchema
);

export default ConsultationSession;
