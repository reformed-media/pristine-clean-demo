import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FadeIn } from "@/components/site/FadeIn";
import { SEO } from "@/components/site/SEO";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid =
    firstName && lastName && email && password && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    setError(null);
    setSubmitting(true);

    const result = await signUp({
      email,
      password,
      firstName,
      lastName,
      phone: phone || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <>
      <SEO
        title="Create Account — Pristine Clean LI"
        description="Create your Pristine Clean LI account to book and manage detailing services."
      />
      <section className="container-x py-16 md:py-24">
        <FadeIn>
          <h1 className="text-display uppercase text-5xl md:text-7xl">
            Create your account.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Book and manage your detailing services in one place.
          </p>
        </FadeIn>

        <div className="mt-10 max-w-lg bg-surface border border-border rounded-sm p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name">
                <input
                  required
                  className="form-input"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last Name">
                <input
                  required
                  className="form-input"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                required
                type="email"
                className="form-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                type="tel"
                className="form-input"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                required
                type="password"
                className="form-input"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {error && (
              <p className="text-sm text-muted-foreground">{error}</p>
            )}

            <button
              type="submit"
              disabled={!valid || submitting}
              className="w-full h-12 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 disabled:opacity-40 transition"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/book?tab=existing"
              className="text-foreground hover:text-primary"
            >
              Log in
            </Link>
          </p>
        </div>
        <FormStyles />
      </section>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormStyles() {
  return (
    <style>{`.form-input{width:100%;height:44px;background:var(--background);border:1px solid var(--border);border-radius:4px;padding:0 12px;color:var(--foreground);font-size:14px;outline:none;transition:border-color .15s}
      .form-input:focus{border-color:var(--primary)}
      textarea.form-input{height:auto;padding:12px;line-height:1.5}`}</style>
  );
}
