import Doctor from "../models/Doctor.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/token.js";
import { Role } from "../constants.js";

function toPublic(doctor) {
  return {
    id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    registrationNumber: doctor.registrationNumber,
    councilName: doctor.councilName,
    specialization: doctor.specialization,
    qualifications: doctor.qualifications,
    languages: doctor.languages,
    experienceYears: doctor.experienceYears,
    isVerified: doctor.isVerified,
    status: doctor.status,
    isActive: doctor.isActive,
    createdAt: doctor.createdAt,
  };
}

export async function registerDoctor(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      registrationNumber,
      councilName,
      specialization,
      qualifications,
      languages,
      experienceYears,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !registrationNumber ||
      !specialization
    ) {
      return res.status(400).json({
        error:
          "name, email, phone, password, registrationNumber and specialization are required",
      });
    }

    const existing = await Doctor.findOne({
      $or: [{ email }, { phone }, { registrationNumber }],
    });
    if (existing) {
      return res.status(409).json({
        error: "email, phone or registration number already in use",
      });
    }

    const passwordHash = await hashPassword(password);
    const doctor = await Doctor.create({
      name,
      email,
      phone,
      passwordHash,
      registrationNumber,
      councilName,
      specialization,
      qualifications,
      languages,
      experienceYears,
    });

    const token = signToken({ id: doctor._id, role: Role.DOCTOR });

    return res.status(201).json({ token, doctor: toPublic(doctor) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "email, phone or registration number already in use",
      });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function loginDoctor(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor || !doctor.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await comparePassword(password, doctor.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    doctor.lastLoginAt = new Date();
    await doctor.save();

    const token = signToken({ id: doctor._id, role: Role.DOCTOR });

    return res.json({ token, doctor: toPublic(doctor) });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function getDoctorProfile(req, res) {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ doctor: toPublic(doctor) });
  } catch {
    return res.status(500).json({ error: "Failed to load profile" });
  }
}
