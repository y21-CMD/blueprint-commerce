import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({
  email: z.string().email().optional().catch(undefined),
  purpose: z.enum(["signup", "password_reset"]).optional().catch(undefined),
});

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify your email — My-Sea International" }] }),
  validateSearch: searchSchema,
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email, purpose: purposeParam } = useSearch({ from: "/verify-otp" });
  const purpose = purposeParam ?? "signup";
  const isReset = purpose === "password_reset";
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      navigate({ to: isReset ? "/forgot-password" : "/signup" });
    }
  }, [email, isReset, navigate]);

  const handleChange = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const code = digits.join("");
    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    const { data: otpId, error } = await supabase.rpc("verify_otp", {
      _email: email,
      _code: code,
      _purpose: purpose,
    });
    setLoading(false);

    if (error || !otpId) {
      toast.error(error?.message ?? "Verification failed.");
      return;
    }

    if (isReset) {
      toast.success("Code verified", { description: "Now choose a new password." });
      navigate({ to: "/reset-password-otp", search: { email, otpId: otpId as string } });
    } else {
      toast.success("Email verified! ✨", {
        description: "Your account is confirmed. You can now sign in.",
        duration: 6000,
      });
      navigate({ to: "/login" });
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { data: otp, error } = await supabase.rpc("create_otp", {
      _email: email,
      _purpose: purpose,
    });
    setResending(false);
    if (error || !otp || !otp[0]) {
      toast.error(error?.message ?? "Couldn't send a new code. Try again.");
      return;
    }
    toast.success("New code generated", {
      description: `Demo code: ${otp[0].code}`,
      duration: 10000,
    });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">My-Sea International</p>
          <h1 className="mt-4 font-display text-4xl text-primary">
            {isReset ? "Verify reset code" : "Verify your email"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-10 space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-12 rounded-md border border-input bg-transparent text-center text-2xl font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
            {loading ? "Verifying…" : "Verify code"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
            <Link
              to={isReset ? "/forgot-password" : "/signup"}
              className="text-muted-foreground hover:text-primary"
            >
              Use a different email
            </Link>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
