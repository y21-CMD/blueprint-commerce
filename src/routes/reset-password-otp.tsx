import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithOtp } from "@/lib/password-reset";
import { toast } from "sonner";

const searchSchema = z.object({
  email: z.string().email().optional().catch(undefined),
  otpId: z.string().uuid().optional().catch(undefined),
});

export const Route = createFileRoute("/reset-password-otp")({
  head: () => ({ meta: [{ title: "Set new password — My-Sea International" }] }),
  validateSearch: searchSchema,
  component: ResetPasswordOtpPage,
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function ResetPasswordOtpPage() {
  const navigate = useNavigate();
  const { email, otpId } = useSearch({ from: "/reset-password-otp" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!email || !otpId) {
      navigate({ to: "/forgot-password" });
    }
  }, [email, otpId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirm });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!email || !otpId) return;

    setLoading(true);
    try {
      await resetPasswordWithOtp({
        data: { email, otpId, password: result.data.password },
      });
      setLoading(false);
      toast.success("Password updated ✨", {
        description: "You can now sign in with your new password.",
        duration: 6000,
      });
      navigate({ to: "/login" });
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Couldn't reset password.";
      toast.error(message);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">My-Sea International</p>
          <h1 className="mt-4 font-display text-4xl text-primary">Set a new password</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Choose a new password for{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
          <div>
            <Label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              New password
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-primary"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirm" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Confirm password
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-primary"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>}
            {!errors.confirm && confirm.length > 0 && password === confirm && (
              <p className="mt-1 text-xs text-primary">Passwords match.</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full rounded-full">
            {loading ? "Updating…" : "Update password"}
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
