import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — My-Sea International" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password updated.");
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-center font-display text-4xl text-primary">
          {mode === "request" ? "Forgot password" : "Set a new password"}
        </h1>
        {mode === "request" ? (
          <form onSubmit={requestReset} className="mt-10 space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="mt-10 space-y-5">
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">New password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
