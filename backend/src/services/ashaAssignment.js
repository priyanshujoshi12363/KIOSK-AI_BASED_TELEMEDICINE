import AshaWorker from "../models/AshaWorker.js";
import Villager from "../models/Villager.js";
import { AshaDuty } from "../constants.js";

export async function workersForDuty(duty) {
  const workers = await AshaWorker.find({
    isActive: true,
    duty: { $in: [duty, AshaDuty.BOTH] },
  }).select("_id");
  if (workers.length) return workers.map((w) => w._id);

  const anyActive = await AshaWorker.find({ isActive: true }).select("_id").limit(20);
  return anyActive.map((w) => w._id);
}

export async function assignAshaForVillage(village) {
  const ashas = await AshaWorker.find({ village, isActive: true }).select("_id");
  if (ashas.length === 0) {
    return null;
  }

  let best = null;
  let bestCount = Infinity;

  for (const asha of ashas) {
    const count = await Villager.countDocuments({ assignedAshaWorker: asha._id });
    if (count < bestCount) {
      bestCount = count;
      best = asha._id;
    }
  }

  return best;
}
