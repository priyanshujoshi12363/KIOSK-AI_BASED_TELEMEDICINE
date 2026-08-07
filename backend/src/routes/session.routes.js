import { Router } from "express";
import {
  createSession,
  getQueue,
  claimSession,
  getSession,
  endSession,
} from "../controllers/session.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { requireKioskKey } from "../middleware/kiosk.js";
import { Role } from "../constants.js";

const router = Router();

router.post("/", requireKioskKey, createSession);
router.get("/queue", authenticate, requireRole(Role.DOCTOR), getQueue);
router.get("/:id", authenticate, requireRole(Role.DOCTOR), getSession);
router.post("/:id/claim", authenticate, requireRole(Role.DOCTOR), claimSession);
router.post("/:id/end", authenticate, requireRole(Role.DOCTOR), endSession);

export default router;
