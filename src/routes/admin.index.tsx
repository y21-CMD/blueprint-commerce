import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, Users, Mail } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — My-Sea International" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    messages: 0,
    revenue: 0,
  });

  useEffect(() => {
    (async () => {
      const [p, o, u, m, rev] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
      ]);
      setStats({
        products: p.count ?? 0,
        orders: o.count ?? 0,
        users: u.count ?? 0,
        messages: m.count ?? 0,
        revenue: (rev.data ?? []).reduce((s, r: { total: number }) => s + Number(r.total ?? 0), 0),
      });
    })();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, icon: Package, to: "/admin/products" },
    { label: "Orders", value: stats.orders, icon: ShoppingCart, to: "/admin/orders" },
    { label: "Users", value: stats.users, icon: Users, to: "/admin/users" },
    { label: "Messages", value: stats.messages, icon: Mail, to: "/admin/messages" },
  ] as const;

  return (
    <AdminLayout title="Overview">
      <div className="mb-8 rounded-lg bg-gradient-sage p-8 text-primary-foreground shadow-elevated">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]/80">
          Total revenue
        </p>
        <p className="mt-2 font-display text-5xl text-[var(--gold)]">
          {formatPrice(stats.revenue)}
        </p>
        <p className="mt-1 text-sm text-primary-foreground/70">
          Across {stats.orders} orders
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group rounded-lg border border-border bg-card p-6 shadow-soft transition-smooth hover:border-[var(--gold)] hover:shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {c.label}
              </p>
              <c.icon className="h-5 w-5 text-[var(--gold-deep)]" />
            </div>
            <p className="mt-4 font-display text-4xl text-primary">{c.value}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
