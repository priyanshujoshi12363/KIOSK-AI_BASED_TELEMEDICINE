import AshaWorker from "../models/AshaWorker.js";
import Villager from "../models/Villager.js";

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
