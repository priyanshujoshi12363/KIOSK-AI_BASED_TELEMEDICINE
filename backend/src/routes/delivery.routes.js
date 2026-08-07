import { Router } from "express";
import {
  getDeliveries,
  markDelivered,
} from "../controllers/delivery.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Role } from "../constants.js";

const router = Router();

router.get("/", authenticate, requireRole(Role.ASHA), getDeliveries);
router.post("/:id/delivered", authenticate, requireRole(Role.ASHA), markDelivered);

export default router;
