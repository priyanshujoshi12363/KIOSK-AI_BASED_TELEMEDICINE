import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import ashaAuthRoutes from "./src/routes/ashaAuth.routes.js";
import doctorAuthRoutes from "./src/routes/doctorAuth.routes.js";
import villagerRoutes from "./src/routes/villager.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.get("/", (req, res) => {
  res.json({ message: "Aarogya Kiosk Backend" });
});

app.use("/api/asha/auth", ashaAuthRoutes);
app.use("/api/doctor/auth", doctorAuthRoutes);
app.use("/api/villager", villagerRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
