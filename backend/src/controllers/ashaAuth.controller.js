import AshaWorker from "../models/AshaWorker.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";
import { Role, AshaDuty } from "../constants.js";

const OPERATOR_PHONE = process.env.OPERATOR_PHONE || "admin";
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD || "admin123";

async function ensureOperator() {
  let op = await AshaWorker.findOne({ phone: OPERATOR_PHONE });
  if (!op) {
    op = await AshaWorker.create({
      name: "Portal Operator",
      phone: OPERATOR_PHONE,
      passwordHash: await hashPassword(OPERATOR_PASSWORD),
      village: "Kollam",
      duty: AshaDuty.OPERATOR,
      isActive: true,
    });
  }
  return op;
}

function toPublic(asha) {
  return {
    id: asha._id,
    name: asha.name,
    phone: asha.phone,
    village: asha.village,
    district: asha.district,
    address: asha.address,
    isActive: asha.isActive,
    createdAt: asha.createdAt,
  };
}

export async function registerAsha(req, res) {
  try {
    const { name, phone, password, village, district, address } = req.body;

    if (!name || !phone || !password || !village) {
      return res
        .status(400)
        .json({ error: "name, phone, password and village are required" });
    }

    const existing = await AshaWorker.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: "Phone already registered" });
    }

    const passwordHash = await hashPassword(password);
    const asha = await AshaWorker.create({
      name,
      phone,
      passwordHash,
      village,
      district,
      address,
    });

    const token = signToken({ id: asha._id, role: Role.ASHA });

    return res.status(201).json({ token, asha: toPublic(asha) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Phone already registered" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function loginAsha(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "phone and password are required" });
    }

    if (phone === OPERATOR_PHONE && password === OPERATOR_PASSWORD) {
      const op = await ensureOperator();
      const token = signToken({ id: op._id, role: Role.ASHA });
      return res.json({ token, asha: toPublic(op) });
    }

    const asha = await AshaWorker.findOne({ phone });
    if (!asha || !asha.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await comparePassword(password, asha.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    asha.lastLoginAt = new Date();
    await asha.save();

    const token = signToken({ id: asha._id, role: Role.ASHA });

    return res.json({ token, asha: toPublic(asha) });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function getAshaProfile(req, res) {
  try {
    const asha = await AshaWorker.findById(req.user.id);
    if (!asha) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ asha: toPublic(asha) });
  } catch {
    return res.status(500).json({ error: "Failed to load profile" });
  }
}
