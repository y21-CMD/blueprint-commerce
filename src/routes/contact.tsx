import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — My-Sea International" },
      {
        name: "description",
        content: "Write to the My-Sea International studio. We answer every letter.",
      },
    ],
  }),
  component: ContactPage,
});

const RECIPIENT = "y23938476@gmail.com";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z
    .string()
    .trim()
    .min(5, "A few more words, please")
    .max(2000, "Message is too long"),
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse({ name, email, message });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: result.data.name,
      email: result.data.email,
      message: result.data.message,
      recipient: RECIPIENT,
    });
    setLoading(false);

    if (error) {
      toast.error("Couldn't send your message. Please try again.");
      return;
    }

    setSent(true);
    toast.success("Message sent — thank you.", {
      description: `We'll reply from ${RECIPIENT}.`,
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-5xl gap-12 px-6 pt-20 pb-24 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Get in touch
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary">
            Write to us.
          </h1>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            We answer every message — usually within two days. For wholesale,
            press, or custom commissions, just say so in your note.
          </p>
          <dl className="mt-10 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Office</dt>
              <dd className="mt-1">Addis Ababa, Ethiopia</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</dt>
              <dd className="mt-1">{RECIPIENT}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hours</dt>
              <dd className="mt-1">Mon–Sat · 9–18</dd>
            </div>
          </dl>

          <div className="mt-8 overflow-hidden rounded-lg border border-border shadow-soft">
            <iframe
              title="My-Sea International office location"
              src="https://www.google.com/maps?q=9.0574969,38.7506648&hl=en&z=17&output=embed"
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href="https://maps.app.goo.gl/6fgcuzbVPN57wAQw9"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card px-4 py-3 text-xs uppercase tracking-[0.18em] text-primary hover:underline"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg border border-border bg-card p-8 shadow-soft"
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="message" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Message</Label>
              <Textarea id="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2" />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading || sent}>
              {loading ? "Sending…" : sent ? "Sent ✓" : "Send message"}
            </Button>
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Delivered to {RECIPIENT}
            </p>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
