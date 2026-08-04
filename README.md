# AI-Assisted Tele-medicine KIOSK for Rural India

> **SIH Problem ID:** SIH1325
> **Theme:** Agriculture, FoodTech & Rural Development
> **Organization:** Government of Kerala
> **Type:** Software (+ Hardware kiosk)
> **Working name:** _Aarogya Kiosk_ (rename freely)

---

## 1. Problem Statement

Healthcare access in rural India is unresolved. This project builds an **AI-assisted
tele-medicine kiosk** deployable in any village. A villager:

1. Marks their identity via a **biometric scanner**.
2. Is **spoken to by an AI agent** (multilingual — Malayalam / English) that enquires
   about their illness.
3. Is routed **online to an expert doctor** (via / like e-Sanjeevani) for a **video consult**.
4. Receives **medicines and services through the local ASHA worker** without delay.

---

## 2. How we reframe it (read this first)

The PS *sounds* like a robot project. It is not. Building a physical robot loses the
software track. The real system is:

> **A resilient, multilingual, AI-driven pre-consultation kiosk that captures a
> villager's identity + symptoms, hands the doctor a structured summary, connects a
> video consult, then closes the loop on medicine fulfillment via the ASHA worker.**

- The "robot that speaks" = a **conversational voice agent** (STT → triage → summary).
- The "biometric" = an **identity / health-record linkage** layer.
- The "AI value" = **NOT diagnosis** (safety/liability). It is triage + a structured
  pre-consult summary that saves the scarce doctor's time. **This is the winning feature.**

### Core architectural principles

| Principle | Why |
|---|---|
| **Shared backend API contract** | Web kiosk + ESP32 hardware kiosk are different clients speaking the *same* API. Define it once. |
| **Thin-client hardware** | ESP32 cannot run STT/LLM. It captures input and streams to backend. All AI is server-side. |
| **Provider abstractions** | e-Sanjeevani, Aadhaar, video — every external dependency sits behind a swappable interface we control. Mock in demo, real later. |
| **Offline-first kiosk** | Rural = poor internet. Local queue + sync-on-reconnect. Most teams ignore this — it's our differentiator. |
| **AI triages, never diagnoses** | Red-flag emergency detection + structured summary only. Doctor makes all clinical decisions. |

---

## 3. System Architecture

```
        CLIENTS                                 BACKEND (single API)
┌──────────────────────────┐          ┌────────────────────────────────────┐
│ 1. Registration Portal   │────────▶ │  Identity / Registration Service    │
│    (operator / admin web)│          │  Auth + RBAC  (JWT, roles)          │
├──────────────────────────┤          │                                     │
│ 2. Kiosk — WEB (React)    │────────▶ │  Consultation Session Service       │
│ 3. Kiosk — HARDWARE       │────────▶ │    (state machine per visit)        │
│    (ESP32-P4 + C6 firmware)│         │                                     │
├──────────────────────────┤          │  AI Service  (STT · triage · summary)│
│ 4. ASHA Worker App (PWA)  │────────▶ │  Prescription Service               │
│    (meds + address)       │          │  Fulfillment Service                │
├──────────────────────────┤          │  Teleconsult Provider (abstract)    │
│ 5. Doctor Web App         │────────▶ │  Signaling (WebRTC) · Notifications │
└──────────────────────────┘          └────────────────────────────────────┘
                                                    │
                                   ┌────────────────┼─────────────────┐
                              ABDM / ABHA      e-Sanjeevani mock   SMS gateway
                              sandbox (real)   (swappable iface)
```

**Both kiosks talk to the same backend.** The web kiosk is the reliable, full-featured
client; the hardware kiosk is the physical embodiment. They never diverge in behavior
because they share the API contract and the same Consultation Session state machine.

---

## 4. The Clients

### 4.1 Registration Portal (web, operator/admin)
Registers villagers so the kiosk "knows" them. Captures:
name, address, phone, demographics, biometric enrollment, ABHA link.
→ Produces a `patientId`.

### 4.2 Kiosk — Web version (React PWA)
The software kiosk. Full browser: mic/camera via `getUserMedia`, **WebRTC video call**,
offline cache. This is the **primary, reliable demo path**. Runs the entire flow:
identify → AI voice intake → triage → video consult → prescription → done.

### 4.3 Kiosk — Hardware version (ESP32-P4 + ESP32-C6) — see §7
Native ESP-IDF firmware. **Thin client**: TFT UI (LVGL), captures fingerprint / audio /
camera, streams to backend over WiFi. All AI happens server-side.

### 4.4 ASHA Worker App (mobile PWA)
Gets the list of assigned villagers, their **prescribed medicines + delivery address**,
and marks medicines dispensed. This closes the fulfillment loop.

### 4.5 Doctor Web App
Reads the **AI pre-consult summary** in ~20 seconds, runs the **WebRTC video consult**,
writes the prescription.

---

## 5. Backend Services (modular monolith — one Express app, clear modules)

> Start as a modular monolith (one deployable, separate modules). Split into services
> only if you actually need to. Hackathon = ship one backend.

| Module | Owns | Key operations |
|---|---|---|
| **Identity / Registration** | Villager profile, address, biometric enrollment, ABHA link | `registerVillager`, `identify(biometric) → patientId` |
| **Auth + RBAC** | Operator / ASHA / Doctor accounts + roles | JWT with role claims |
| **Consultation Session** | One "visit" as a **state machine** (the spine) | `createSession`, `advance(state)`, `getSession` |
| **AI Service** | STT (ML/EN), triage + red-flag detection, structured summary | `transcribe(audio)`, `summarize(text) → SOAP + urgency` |
| **Teleconsult Provider** | Swappable interface over e-Sanjeevani / own video | `startConsult(session)` — mock in demo |
| **Signaling** | WebRTC offer/answer/ICE relay between kiosk ↔ doctor | WebSocket rooms per session |
| **Prescription** | Doctor's Rx tied to a session | `createRx`, `getRx(patientId)` |
| **Fulfillment** | Routes Rx → ASHA, address, inventory, delivery status | `assignToAsha`, `markDispensed` |
| **Notification** | SMS / push to ASHA + patient | fire-and-forget |

### Provider interfaces (the abstraction that makes it demoable AND credible)

```ts
interface IdentityProvider {          // Aadhaar needs an AUA/KUA license we won't have.
  enroll(biometric): Promise<PatientId>   // demo: mock fingerprint
  identify(biometric): Promise<PatientId | null>
}

interface TeleconsultProvider {       // e-Sanjeevani is a closed govt system.
  startConsult(session): Promise<ConsultHandle>  // demo: our own WebRTC
}                                                 // prod: swap to e-Sanjeevani
```

Every external dependency lives behind an interface **we own**. Tell the judges exactly
this — it shows system maturity and dodges the "did you really integrate e-Sanjeevani?"
trap in Q&A.

---

## 6. Consultation Session — the state machine (the spine)

Every client reads/advances the **same** session. This is what keeps 5 clients coherent.

```
IDENTIFIED ──▶ INTAKE ──▶ TRIAGED ──▶ IN_CONSULT ──▶ PRESCRIBED ──▶ DISPENSED
    │            │           │                                          │
 identity     AI voice   red-flag?                                 ASHA marks
 confirmed    symptom   ├─ EMERGENCY ──▶ escalate / 108           delivered
              capture   └─ normal ──▶ queue for doctor
```

- **IDENTIFIED** – biometric/ABHA matched → `patientId`.
- **INTAKE** – AI voice agent collects symptoms (Malayalam/English).
- **TRIAGED** – urgency classified; **red flags escalate immediately**.
- **IN_CONSULT** – WebRTC video with doctor; doctor sees the AI summary.
- **PRESCRIBED** – doctor writes Rx → stored.
- **DISPENSED** – Fulfillment routes Rx + address to ASHA → marked delivered.

---

## 7. Hardware Kiosk — ESP32-P4 + ESP32-C6

### Role split
- **ESP32-P4** — the compute/UI brain. Drives the **TFT (LVGL)**, reads **camera** (MIPI-CSI/DVP),
  **I2S mic**, **fingerprint** sensor, and peripherals. Hardware JPEG codec for frames.
- **ESP32-C6** — connectivity co-processor. **WiFi 6** (+ BLE/Thread if needed) uplink to backend.
  Typically bridged over SDIO/SPI as the P4's network interface.

### It is a THIN CLIENT (this is the key feasibility decision)
The ESP32 does **not** run AI. It:
1. Shows UI on the TFT (LVGL screens mirror the web-kiosk flow).
2. Captures fingerprint → sends template to backend `identify()`.
3. Captures **audio** (I2S mic) → streams to backend STT.
4. Captures **camera** frames (JPEG) → streams to backend.
5. Receives instructions / summary / TTS audio back and plays/displays them.

All STT, triage, LLM summary, and doctor routing happen **server-side**. The kiosk is
eyes, ears, and a screen — nothing more.

### Peripheral map (behind a firmware HAL)
| Peripheral | Interface | Notes |
|---|---|---|
| TFT display | MIPI-DSI / SPI + LVGL | UI mirrors web kiosk flow |
| Camera | MIPI-CSI or DVP + JPEG codec | patient photo + video frames |
| Microphone | I2S | audio for STT |
| Speaker | I2S / DAC | plays doctor audio / TTS |
| Fingerprint | UART / SPI module (e.g. R307-class) | template → backend |
| Vitals (optional) | UART / BLE (BP, SpO2, temp) | seeded/mock in demo |
| Printer (optional) | UART ESC/POS | prints Rx / token |

### ⚠️ RISK: two-way video call on ESP32
Full WebRTC (audio+video) on ESP32 is **bleeding-edge** (Espressif's `esp-webrtc`
exists but is hard and time-expensive).

**Plan around it:**
- ✅ **Web kiosk = primary, reliable video path** (browser WebRTC — just works).
- 🟡 **Hardware kiosk video = stretch goal.** Pragmatic path: kiosk streams camera as
  **MJPEG/JPEG frames + I2S audio** to backend; backend relays to doctor; doctor's video
  shown on TFT as MJPEG. Simpler than full WebRTC. Attempt only after the web path works.
- **Demo safety net:** if hardware video isn't ready, demo the video consult on the web
  kiosk and use the hardware kiosk for identity + AI voice intake + display. Same backend,
  fully honest.

---

## 8. AI Pipeline (server-side)

```
audio (ML/EN) ──▶ STT ──▶ text ──▶ Triage/NLP ──▶ urgency + red-flags
                                       │
                                       ▼
                              LLM structured summary (SOAP-ish)
                              ┌──────────────────────────────┐
                              │ Chief complaint               │
                              │ Symptoms, duration, severity  │
                              │ Relevant history              │
                              │ Urgency: EMERGENCY/URGENT/ROUTINE │
                              │ Red flags (if any)            │
                              └──────────────────────────────┘
                                       ▼
                             Doctor reads in ~20 seconds
```

- **STT:** Malayalam + English. (Options: Whisper / Bhashini / cloud STT — evaluate.)
- **Triage:** rule-based red-flag list (chest pain, breathlessness, stroke signs, etc.)
  **first** for safety, then LLM for nuance.
- **Summary:** LLM produces a structured, doctor-friendly note. **Never a diagnosis.**
- **TTS:** for the "robot speaks" experience (Malayalam) — optional but high-impact.

**Safety rule baked in:** any red flag → session escalates to EMERGENCY, bypasses the
normal queue, surfaces a "seek immediate care / 108" prompt.

---

## 9. External Integrations & how we handle them

| Dependency | Reality | Our approach |
|---|---|---|
| **e-Sanjeevani** | Closed C-DAC/MoHFW system, no hackathon API access | Behind `TeleconsultProvider`; our own WebRTC as the demo impl, swappable later |
| **Aadhaar biometric** | Needs AUA/KUA license | Behind `IdentityProvider`; mock fingerprint in demo |
| **ABHA (Ayushman Bharat Health Account)** | ABDM **sandbox is real & open** | Use it for identity/health-record linkage — the demoable, compliant path |
| **SMS to ASHA/patient** | Needs a gateway | Mock/notification stub in demo |

---

## 10. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | **Node.js + Express** (already started) | Modular monolith |
| AI service | **Python (FastAPI)** as a separate service | STT / LLM ecosystem lives in Python |
| DB | **PostgreSQL** (+ Redis for queues/sessions) | Relational fits patients/sessions/Rx |
| Web kiosk / Portal / Doctor / ASHA apps | **React** (PWA) | ASHA app offline-capable |
| Realtime / video | **WebRTC** + WebSocket signaling | Doctor ↔ web kiosk |
| Hardware kiosk | **ESP-IDF (C/C++) + LVGL** | ESP32-P4 UI/compute, ESP32-C6 WiFi 6 |
| Offline sync | Local outbox queue on kiosk | Sync on reconnect |

> Node handles the app/API layer; Python owns AI. They communicate over HTTP.
> This keeps each language doing what it's best at.

---

## 11. Suggested Repository Structure

```
project/
├── backend/                 # Express API (already started)
│   ├── modules/
│   │   ├── identity/
│   │   ├── auth/
│   │   ├── session/         # consultation state machine
│   │   ├── prescription/
│   │   ├── fulfillment/
│   │   ├── teleconsult/     # provider interface + mock impl
│   │   └── signaling/       # WebRTC signaling (WS)
│   └── server.js
├── ai-service/              # Python FastAPI: STT, triage, summary
├── web-kiosk/               # React PWA (primary kiosk + video)
├── registration-portal/     # React admin web
├── doctor-app/              # React doctor dashboard + video
├── asha-app/                # React PWA (meds + address + dispense)
├── firmware-kiosk/          # ESP-IDF: ESP32-P4 (LVGL) + ESP32-C6 (WiFi)
└── README.md
```

> Web apps can share components via a small shared package/monorepo if you like, but
> don't over-engineer the tooling during a hackathon.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| ESP32 two-way video is hard | Web kiosk is primary video path; hardware video is a stretch (MJPEG) |
| e-Sanjeevani not integrable | Provider interface + own WebRTC; state it openly |
| Aadhaar licensing | Mock fingerprint behind `IdentityProvider`; use ABHA sandbox |
| Malayalam STT accuracy | Evaluate Bhashini/Whisper early; allow text fallback |
| Rural connectivity | Offline-first kiosk with sync queue |
| AI medical liability | AI triages + summarizes only; doctor decides; hard red-flag rules |
| Doing too much | Web-first demo; hardware + video as layered stretch goals |

---

## 13. Demo Strategy (the judge-facing story)

1. **Register** a villager on the portal (name, address, ABHA).
2. Villager walks to the **kiosk**, authenticates (fingerprint/ABHA).
3. **AI voice agent** asks about the illness in **Malayalam**, builds a structured summary.
4. **Red-flag demo:** show an emergency symptom → instant escalation. (Big judge moment.)
5. Normal case → **video consult** with the doctor, who reads the AI summary instantly.
6. Doctor writes a **prescription**.
7. **ASHA worker app** lights up with the villager's **meds + address** → marks delivered.
8. Show the **offline** scenario: kiosk works with no internet, syncs on reconnect.
9. Close with the **architecture**: provider abstractions, ABHA compliance, thin-client
   hardware — "production-ready path, not a toy."

**Priority order to build:** Registration → AI intake + triage + summary → ASHA
fulfillment loop → doctor video (web) → hardware kiosk → hardware video (stretch).

---

_This document is the single source of truth for the system design. Keep it updated as
decisions change._
