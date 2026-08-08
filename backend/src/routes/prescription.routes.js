import { Router } from "express";
import {
  getCatalog,
  createPrescription,
  createDraftFromCall,
  getDraft,
  confirmPrescription,
  getSessionPrescription,
} from "../controllers/prescription.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { requireKioskKey } from "../middleware/kiosk.js";
import { Role } from "../constants.js";

const router = Router();

router.get("/catalog", authenticate, requireRole(Role.DOCTOR), getCatalog);
router.post("/", authenticate, requireRole(Role.DOCTOR), createPrescription);

router.post("/draft", requireKioskKey, createDraftFromCall);
router.get("/session/:sessionId", requireKioskKey, getSessionPrescription);

router.get("/draft/:sessionId", authenticate, requireRole(Role.DOCTOR), getDraft);
router.post("/:id/confirm", authenticate, requireRole(Role.DOCTOR), confirmPrescription);

export default router;
