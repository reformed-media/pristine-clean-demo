import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();

  if (authLoading || adminLoading) return null;
  if (!session) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
