import { Router } from "express";
import agoraToken from "agora-token";

const { RtcTokenBuilder, RtcRole } = agoraToken;

const router = Router();

const TOKEN_TTL_SECONDS = 3600;

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
    provider: process.env.AGORA_APP_ID ? "agora" : "webrtc",
  });
});

router.get("/agora/token", (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const certificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId) {
    return res.status(503).json({ error: "agora_not_configured" });
  }

  const channel = (req.query.channel || "").trim();
  if (!channel) {
    return res.status(400).json({ error: "channel is required" });
  }

  const uid = Number(req.query.uid) || 0;

  if (!certificate) {
    return res.json({ appId, channel, uid, token: null, expiresIn: null });
  }

  const expireAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    certificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expireAt,
    expireAt
  );

  res.json({ appId, channel, uid, token, expiresIn: TOKEN_TTL_SECONDS });
});

export default router;
