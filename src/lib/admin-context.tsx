import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

export type AdminUserRow = {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "employee";
  is_active: boolean;
};

type AdminContextValue = {
  isAdmin: boolean;
  adminUser: AdminUserRow | null;
  adminLoading: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUserRow | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user) {
      setAdminUser(null);
      setFetched(true);
      return;
    }
    setFetched(false);
    supabase
      .from("admin_users")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setAdminUser(data as AdminUserRow | null);
        setFetched(true);
      });
  }, [session, authLoading]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin: adminUser !== null,
        adminUser,
        adminLoading: authLoading || !fetched,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
