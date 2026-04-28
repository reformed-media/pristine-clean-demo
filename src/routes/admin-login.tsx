import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Check admin_users after successful auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access.");
      setLoading(false);
      return;
    }

    navigate("/admin/today", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Pristine Clean LI
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Admin Login
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="nick@pristineclean.com"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-primary text-primary-foreground rounded-sm text-sm font-medium disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
