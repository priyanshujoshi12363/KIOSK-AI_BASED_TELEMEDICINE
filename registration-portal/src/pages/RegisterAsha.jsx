import { useState } from "react";
import { Card, Field, Input, Button, Alert, SectionTitle } from "../components/ui.jsx";
import { apiPost } from "../lib/api.js";

const empty = {
  name: "",
  phone: "",
  password: "",
  village: "",
  district: "",
  address: "",
};

export default function RegisterAsha() {
  const [form, setForm] = useState(empty);
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
      const data = await apiPost("/api/asha/auth/register", form);
      setStatus({
        type: "success",
        msg: `${data.asha.name} registered for ${data.asha.village}.`,
      });
      setForm(empty);
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <SectionTitle
        eyebrow="Field Health Worker"
        title="Register ASHA Worker"
        subtitle="ASHA workers deliver prescribed medicines to villagers and receive assignment notifications for their village."
      />
      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5">
          {status && <Alert type={status.type}>{status.msg}</Alert>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
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
            <Field label="Village" required>
              <Input value={form.village} onChange={(e) => set("village", e.target.value)} required />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Registering…" : "Register ASHA Worker"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
