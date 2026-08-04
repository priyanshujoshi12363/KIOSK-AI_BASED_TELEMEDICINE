import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Card,
  Field,
  Input,
  Select,
  Button,
  Alert,
  SectionTitle,
} from "../components/ui.jsx";
import { apiPost } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const empty = {
  name: "",
  aadhaarNumber: "",
  gender: "MALE",
  dateOfBirth: "",
  phone: "",
  village: "",
  address: "",
};

export default function RegisterVillager() {
  const { token, operator } = useAuth();
  const webcamRef = useRef(null);
  const [form, setForm] = useState(empty);
  const [faceImage, setFaceImage] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot();
    if (shot) setFaceImage(shot);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    if (!faceImage) {
      setStatus({ type: "error", msg: "Please capture the villager's face first." });
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost(
        "/api/villager/register",
        { ...form, faceImage },
        token
      );
      const assigned = data.villager.assignedAshaWorker
        ? "An ASHA worker has been assigned."
        : "No ASHA worker available for this village yet.";
      setStatus({
        type: "success",
        msg: `${data.villager.name} registered (Aadhaar ****${data.villager.aadhaarLast4}). ${assigned}`,
      });
      setForm(empty);
      setFaceImage(null);
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md animate-fade-up">
        <SectionTitle
          eyebrow="Restricted"
          title="Login Required"
          subtitle="Villager registration must be performed by an authorized ASHA worker or operator."
        />
        <Card className="p-6">
          <Alert type="info">
            You are not signed in. Please log in to register villagers.
          </Alert>
          <Link
            to="/login"
            state={{ from: "/register/villager" }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-saffron px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-saffron/90"
          >
            Go to Operator Login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <SectionTitle
        eyebrow="Citizen Enrollment"
        title="Register Villager"
        subtitle={`Signed in as ${operator?.name}. Capture the villager's face and verify Aadhaar to enroll.`}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <form onSubmit={submit} className="space-y-5">
            {status && <Alert type={status.type}>{status.msg}</Alert>}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label="Aadhaar Number" required hint="12 digits · stored hashed, never raw">
                <Input
                  value={form.aadhaarNumber}
                  onChange={(e) => set("aadhaarNumber", e.target.value)}
                  maxLength={12}
                  placeholder="XXXXXXXXXXXX"
                  required
                />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="MALE" className="bg-white">Male</option>
                  <option value="FEMALE" className="bg-white">Female</option>
                  <option value="OTHER" className="bg-white">Other</option>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Village" required>
                <Input value={form.village} onChange={(e) => set("village", e.target.value)} required />
              </Field>
            </div>

            <Field label="Address" required>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="House no., locality, landmark"
                required
              />
            </Field>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Enrolling…" : "Enroll Villager"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <p className="mb-1 text-sm font-semibold text-zinc-900">Biometric Face Capture</p>
          <p className="mb-4 text-xs text-zinc-500">
            Center the villager's face. Only the encrypted face signature is stored.
          </p>

          <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-300 bg-zinc-900">
            {faceImage ? (
              <img src={faceImage} alt="captured" className="h-full w-full object-cover" />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                mirrored
                className="h-full w-full object-cover"
                videoConstraints={{ facingMode: "user" }}
              />
            )}
            <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-dashed border-white/30" />
          </div>

          <div className="mt-4 flex gap-2">
            {faceImage ? (
              <Button variant="ghost" className="flex-1" onClick={() => setFaceImage(null)} type="button">
                Retake
              </Button>
            ) : (
              <Button className="flex-1" onClick={capture} type="button">
                Capture Face
              </Button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${faceImage ? "bg-indiagreen" : "bg-zinc-600"}`}
            />
            <span className="text-zinc-400">
              {faceImage ? "Face captured" : "Awaiting capture"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
