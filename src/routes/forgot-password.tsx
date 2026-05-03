import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — My-Sea International" }] }),
  component: ForgotPasswordPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setLoading(true);
    const { data: otp, error: insertError } = await supabase.rpc("create_otp", {
      _email: parsed.data,
      _purpose: "password_reset",
    });
    setLoading(false);

    if (insertError || !otp || !otp[0]) {
      toast.error(insertError?.message ?? "Couldn't send a reset code. Please try again.");
      return;
    }

    toast.success("Reset code sent", {
      description: `Demo code: ${otp[0].code}`,
      duration: 12000,
    });
    navigate({ to: "/verify-otp", search: { email: parsed.data, purpose: "password_reset" } });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">My-Sea International</p>
          <h1 className="mt-4 font-display text-4xl text-primary">Forgot password</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your email and we'll send you a 6-digit reset code.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
            {loading ? "Sending…" : "Send reset code"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
