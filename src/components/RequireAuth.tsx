import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/book?tab=existing" replace />;

  return <>{children}</>;
}
