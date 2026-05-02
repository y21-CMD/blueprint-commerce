import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST to avoid missing events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer to avoid deadlocks
      if (s?.user) {
        setTimeout(() => checkBlocked(s.user.id), 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        setTimeout(() => checkBlocked(data.session!.user.id), 0);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // If a user is blocked, sign them out immediately.
  const checkBlocked = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_blocked")
      .eq("id", userId)
      .maybeSingle();
    if (data?.is_blocked) {
      await supabase.auth.signOut();
      toast.error("Your account has been blocked. Please contact support.");
    }
  };

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
