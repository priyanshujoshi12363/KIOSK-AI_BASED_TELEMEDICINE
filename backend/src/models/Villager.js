import mongoose from "mongoose";
import { Gender } from "../constants.js";

const villagerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    phone: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    aadhaarHash: {
      type: String,
      required: true,
      unique: true,
    },
    aadhaarLast4: {
      type: String,
      required: true,
    },
    faceEmbedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
    abhaId: {
      type: String,
      trim: true,
    },
    assignedAshaWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AshaWorker",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

villagerSchema.index({ village: 1 });
villagerSchema.index({ assignedAshaWorker: 1 });

const Villager = mongoose.model("Villager", villagerSchema);

export default Villager;
