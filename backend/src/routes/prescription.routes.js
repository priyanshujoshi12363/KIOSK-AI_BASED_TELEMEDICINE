import { Router } from "express";
import {
  getCatalog,
  createPrescription,
} from "../controllers/prescription.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Role } from "../constants.js";

const router = Router();

router.get("/catalog", authenticate, requireRole(Role.DOCTOR), getCatalog);
router.post("/", authenticate, requireRole(Role.DOCTOR), createPrescription);

export default router;
