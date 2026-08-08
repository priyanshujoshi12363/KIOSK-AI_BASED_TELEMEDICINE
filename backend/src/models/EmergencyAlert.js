import mongoose from "mongoose";
import {
  EmergencyCategory,
  EmergencySeverity,
  EmergencyStatus,
} from "../constants.js";

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    label: { type: String, trim: true },
    source: { type: String, trim: true },
  },
  { _id: false }
);

const emergencyAlertSchema = new mongoose.Schema(
  {
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villager",
    },
    ashaWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AshaWorker",
    },
    village: {
      type: String,
      trim: true,
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: "hi",
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(EmergencyCategory),
      default: EmergencyCategory.OTHER,
    },
    severity: {
      type: String,
      enum: Object.values(EmergencySeverity),
      default: EmergencySeverity.MODERATE,
    },
    patient: {
      type: String,
      trim: true,
    },
    matched: {
      type: [String],
      default: [],
    },
    location: locationSchema,
    status: {
      type: String,
      enum: Object.values(EmergencyStatus),
      default: EmergencyStatus.OPEN,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ ashaWorker: 1, status: 1 });

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
