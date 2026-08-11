import mongoose from "mongoose";
import { AshaDuty } from "../constants.js";

const ashaWorkerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    duty: {
      type: String,
      enum: Object.values(AshaDuty),
      default: AshaDuty.BOTH,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ashaWorkerSchema.index({ village: 1 });

const AshaWorker = mongoose.model("AshaWorker", ashaWorkerSchema);

export default AshaWorker;
