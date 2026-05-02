import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  shipping_city: string;
  shipping_country: string;
  order_items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Account — My-Sea International" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/dashboard" } });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total, shipping_city, shipping_country, order_items(id, product_name, product_image, quantity, unit_price)")
        .order("created_at", { ascending: false });
      if (!cancelled && !error) setOrders((data ?? []) as OrderRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-6 py-32 text-center text-muted-foreground">
          Loading…
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Your account
            </p>
            <h1 className="mt-3 font-display text-5xl text-primary">
              Hello, {user.email?.split("@")[0]}
            </h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button asChild className="rounded-full bg-[var(--gold)] text-[var(--ink)] hover:bg-[var(--gold-deep)]">
                <Link to="/admin">Admin panel</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        <h2 className="mt-16 mb-6 font-display text-3xl">Order history</h2>

        {orders === null ? (
          <p className="text-muted-foreground">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-12 text-center">
            <p className="text-muted-foreground">
              You haven't placed an order yet.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/catalog">Shop the collection</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-6">
            {orders.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="font-display text-xl">
                      Order #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      · {o.shipping_city}, {o.shipping_country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-primary">
                      {formatPrice(Number(o.total))}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {o.status}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {o.order_items.map((it) => (
                    <li key={it.id} className="flex items-center gap-4">
                      {it.product_image && (
                        <img
                          src={it.product_image}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="flex-1">
                        {it.product_name}{" "}
                        <span className="text-muted-foreground">
                          × {it.quantity}
                        </span>
                      </span>
                      <span>
                        {formatPrice(Number(it.unit_price) * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}
