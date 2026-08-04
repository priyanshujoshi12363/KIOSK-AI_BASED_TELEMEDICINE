import { Router } from "express";
import {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
} from "../controllers/doctorAuth.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Role } from "../constants.js";

const router = Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.get("/me", authenticate, requireRole(Role.DOCTOR), getDoctorProfile);

export default router;
