import mongoose from "mongoose";
import { PrescriptionStatus } from "../constants.js";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    quantity: { type: Number, default: 1 },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationSession",
      required: true,
    },
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Villager",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    medicines: {
      type: [itemSchema],
      default: [],
    },
    advice: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: "manual",
    },
    status: {
      type: String,
      enum: Object.values(PrescriptionStatus),
      default: PrescriptionStatus.CONFIRMED,
    },
    confirmedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ session: 1 });
prescriptionSchema.index({ villager: 1 });
prescriptionSchema.index({ doctor: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
