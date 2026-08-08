import { Router } from "express";
import {
  createEmergency,
  getEmergencies,
  acknowledgeEmergency,
  resolveEmergency,
} from "../controllers/emergency.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { requireKioskKey } from "../middleware/kiosk.js";
import { Role } from "../constants.js";

const router = Router();

router.post("/", requireKioskKey, createEmergency);
router.get("/", authenticate, requireRole(Role.ASHA), getEmergencies);
router.post("/:id/acknowledge", authenticate, requireRole(Role.ASHA), acknowledgeEmergency);
router.post("/:id/resolve", authenticate, requireRole(Role.ASHA), resolveEmergency);

export default router;
