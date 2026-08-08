import { Router } from "express";

const router = Router();

function iceServers() {
  const servers = [];

  const stun = process.env.STUN_URLS || "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302";
  servers.push({ urls: stun.split(",").map((s) => s.trim()).filter(Boolean) });

  const turnUrls = (process.env.TURN_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (turnUrls.length && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    servers.push({
      urls: turnUrls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
    });
  }

  return servers;
}

router.get("/config", (req, res) => {
  const servers = iceServers();
  res.json({
    iceServers: servers,
    hasTurn: servers.length > 1,
    iceTransportPolicy: process.env.FORCE_TURN === "true" ? "relay" : "all",
  });
});

export default router;
