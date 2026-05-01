import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Submission = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Admin" }] }),
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const [items, setItems] = useState<Submission[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems((data ?? []) as Submission[]);
    })();
  }, []);

  if (items === null) {
    return (
      <AdminLayout title="Messages">
        <p className="text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Messages">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
          No contact submissions yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((m) => (
            <li key={m.id} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                <div>
                  <p className="font-display text-xl text-primary">{m.name}</p>
                  <a href={`mailto:${m.email}`} className="text-sm text-[var(--gold-deep)] hover:underline">
                    {m.email}
                  </a>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
