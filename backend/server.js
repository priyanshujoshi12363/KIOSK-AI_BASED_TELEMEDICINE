import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { initSignaling } from "./src/signaling.js";
import ashaAuthRoutes from "./src/routes/ashaAuth.routes.js";
import doctorAuthRoutes from "./src/routes/doctorAuth.routes.js";
import villagerRoutes from "./src/routes/villager.routes.js";
import sessionRoutes from "./src/routes/session.routes.js";
import prescriptionRoutes from "./src/routes/prescription.routes.js";
import deliveryRoutes from "./src/routes/delivery.routes.js";
import emergencyRoutes from "./src/routes/emergency.routes.js";
import rtcRoutes from "./src/routes/rtc.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.get("/", (req, res) => {
  res.json({ message: "Aarogya Kiosk Backend" });
});

app.use("/api/asha/auth", ashaAuthRoutes);
app.use("/api/doctor/auth", doctorAuthRoutes);
app.use("/api/villager", villagerRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/asha/deliveries", deliveryRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/rtc", rtcRoutes);

const server = http.createServer(app);
initSignaling(server);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
