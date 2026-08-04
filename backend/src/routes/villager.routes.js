import { Router } from "express";
import {
  registerVillager,
  identifyVillager,
  getVillager,
} from "../controllers/villager.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { requireKioskKey } from "../middleware/kiosk.js";
import { Role } from "../constants.js";

const router = Router();

router.post(
  "/register",
  authenticate,
  requireRole(Role.ASHA, Role.OPERATOR, Role.ADMIN),
  registerVillager
);

router.post("/identify", requireKioskKey, identifyVillager);

router.get(
  "/:id",
  authenticate,
  requireRole(Role.ASHA, Role.OPERATOR, Role.ADMIN, Role.DOCTOR),
  getVillager
);

export default router;
