import { Router } from "express";
import {
  registerAsha,
  loginAsha,
  getAshaProfile,
} from "../controllers/ashaAuth.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Role } from "../constants.js";

const router = Router();

router.post("/register", registerAsha);
router.post("/login", loginAsha);
router.get("/me", authenticate, requireRole(Role.ASHA), getAshaProfile);

export default router;
