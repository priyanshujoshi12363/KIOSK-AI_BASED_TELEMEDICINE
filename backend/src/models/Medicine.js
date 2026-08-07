import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    form: {
      type: String,
      trim: true,
    },
    defaultDosage: {
      type: String,
      trim: true,
    },
    defaultQuantity: {
      type: Number,
      default: 1,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text" });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
