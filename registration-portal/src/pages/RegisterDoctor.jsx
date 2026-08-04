import { useState } from "react";
import {
  Card,
  Field,
  Input,
  Select,
  Button,
  Alert,
  SectionTitle,
} from "../components/ui.jsx";
import TagInput from "../components/TagInput.jsx";
import { apiPost } from "../lib/api.js";

const empty = {
  name: "",
  email: "",
  phone: "",
  password: "",
  registrationNumber: "",
  councilName: "",
  specialization: "General Medicine",
  experienceYears: "",
};

const specializations = [
  "General Medicine",
  "Pediatrics",
  "Gynaecology",
  "Dermatology",
  "Cardiology",
  "Orthopedics",
  "Psychiatry",
  "ENT",
];

export default function RegisterDoctor() {
  const [form, setForm] = useState(empty);
  const [qualifications, setQualifications] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const data = await apiPost("/api/doctor/auth/register", {
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
        qualifications,
        languages,
      });
      setStatus({
        type: "success",
        msg: `Dr. ${data.doctor.name} registered. Pending admin verification.`,
      });
      setForm(empty);
      setQualifications([]);
      setLanguages([]);
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <SectionTitle
        eyebrow="Medical Practitioner"
        title="Register Doctor"
        subtitle="Doctors are onboarded as unverified and activated after admin verification of their medical council registration."
      />
      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5">
          {status && <Alert type={status.type}>{status.msg}</Alert>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone" required>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </Field>
            <Field label="Medical Registration No." required>
              <Input
                value={form.registrationNumber}
                onChange={(e) => set("registrationNumber", e.target.value)}
                required
              />
            </Field>
            <Field label="Medical Council">
              <Input
                value={form.councilName}
                onChange={(e) => set("councilName", e.target.value)}
                placeholder="e.g. Kerala Medical Council"
              />
            </Field>
            <Field label="Specialization" required>
              <Select
                value={form.specialization}
                onChange={(e) => set("specialization", e.target.value)}
              >
                {specializations.map((s) => (
                  <option key={s} value={s} className="bg-white">
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Experience (years)">
              <Input
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={(e) => set("experienceYears", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Qualifications" hint="Type and press Enter (e.g. MBBS, MD)">
            <TagInput value={qualifications} onChange={setQualifications} placeholder="Add qualification" />
          </Field>
          <Field label="Languages Spoken" hint="Used to match patients to a doctor in their language">
            <TagInput value={languages} onChange={setLanguages} placeholder="Add language" />
          </Field>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Registering…" : "Register Doctor"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
