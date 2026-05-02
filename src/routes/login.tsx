import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — My-Sea International" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: redirect ?? "/dashboard" });
  }, [user, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
    navigate({ to: redirect ?? "/dashboard" });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            My-Sea International
          </p>
          <h1 className="mt-4 font-display text-4xl text-primary">Welcome back</h1>
        </div>
        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Email
            </Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Password
            </Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
            Forgot password?
          </Link>
          <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
            Create account
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
