import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lestationery" },
      {
        name: "description",
        content: "Write to the Lestationery studio. We answer every letter.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

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
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studio</dt>
              <dd className="mt-1">Söder Mälarstrand 27, Stockholm</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</dt>
              <dd className="mt-1">hello@lestationery.com</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hours</dt>
              <dd className="mt-1">Tue–Sat · 11–18</dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Message sent — thank you.");
          }}
          className="rounded-lg border border-border bg-card p-8 shadow-soft"
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Name</Label>
              <Input id="name" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</Label>
              <Input id="email" type="email" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="message" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Message</Label>
              <Textarea id="message" required rows={6} className="mt-2" />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={sent}>
              {sent ? "Sent" : "Send message"}
            </Button>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
