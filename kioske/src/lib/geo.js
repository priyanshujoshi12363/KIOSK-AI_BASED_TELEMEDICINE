const FIXED_LAT = Number(import.meta.env.VITE_KIOSK_LAT);
const FIXED_LNG = Number(import.meta.env.VITE_KIOSK_LNG);
const LABEL = import.meta.env.VITE_KIOSK_LABEL || "";
const VILLAGE = import.meta.env.VITE_KIOSK_VILLAGE || "";

export const kioskVillage = VILLAGE;

function fixedLocation() {
  if (Number.isFinite(FIXED_LAT) && Number.isFinite(FIXED_LNG)) {
    return { lat: FIXED_LAT, lng: FIXED_LNG, label: LABEL, source: "kiosk" };
  }
  return null;
}

export function getLocation({ timeoutMs = 6000 } = {}) {
  return new Promise((resolve) => {
    const fixed = fixedLocation();
    if (fixed) return resolve(fixed);

    if (!navigator.geolocation) return resolve(null);

    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timer = setTimeout(() => done(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        done({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          label: LABEL,
          source: "device",
        });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
