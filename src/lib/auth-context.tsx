import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type ClientRow = {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lifetime_spend_cents: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type AuthResult = { error: string | null };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  client: ClientRow | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshClient: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();
    setClient(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchClient(s.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchClient(s.user.id);
      } else {
        setClient(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchClient]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }): Promise<AuthResult> => {
      const { data, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
            phone: params.phone || null,
          },
        },
      });
      if (authError) return { error: authError.message };
      if (!data.user) return { error: "Signup failed. Please try again." };

      return { error: null };
    },
    [],
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setClient(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        client,
        loading,
        signIn,
        signUp,
        signOut: handleSignOut,
        refreshClient: async () => {
          const uid = session?.user?.id;
          if (uid) await fetchClient(uid);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
