import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, Field, Input, Button, Alert, SectionTitle } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/register/villager";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.phone, form.password);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      <SectionTitle
        eyebrow="Secure Access"
        title="Operator Login"
        subtitle="Log in as an ASHA worker or operator to register villagers."
      />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Registered phone number"
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-500">
          No account?{" "}
          <Link to="/register/asha" className="text-saffron hover:underline">
            Register as ASHA Worker
          </Link>
        </p>
      </Card>
    </div>
  );
}
