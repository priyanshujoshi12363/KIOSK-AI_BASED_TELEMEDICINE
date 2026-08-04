export function requireKioskKey(req, res, next) {
  const key = req.headers["x-kiosk-key"];
  if (!key || key !== process.env.KIOSK_API_KEY) {
    return res.status(401).json({ error: "Invalid kiosk key" });
  }
  next();
}
