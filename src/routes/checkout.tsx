import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { placeOrder } from "@/server/orders.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — My-Sea International" }] }),
  component: CheckoutPage,
});

type Form = {
  name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
};

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
  });

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [user, form.email]);

  const shipping = subtotal > 80 || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;

  if (!authLoading && !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-6 py-32 text-center">
          <h1 className="font-display text-4xl text-primary">
            Sign in to continue
          </h1>
          <p className="mt-3 text-muted-foreground">
            We use your account to keep your order history and addresses.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link
                to="/login"
                search={{ redirect: "/checkout" }}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-6 py-32 text-center">
          <h1 className="font-display text-4xl text-primary">Cart is empty</h1>
          <Button asChild className="mt-8">
            <Link to="/catalog">Shop the collection</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await placeOrder({
        data: {
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
          shipping: {
            name: form.name,
            email: form.email,
            address: form.address,
            city: form.city,
            postal_code: form.postal_code,
            country: form.country,
          },
        },
      });
      clear();
      toast.success("Order placed — thank you.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <h1 className="mb-12 font-display text-5xl text-primary">Checkout</h1>
        <form
          onSubmit={handleSubmit}
          className="grid gap-12 md:grid-cols-[1fr_360px]"
        >
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 font-display text-2xl">Shipping</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" id="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label="Email" id="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                <div className="sm:col-span-2">
                  <Field label="Address" id="address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
                </div>
                <Field label="City" id="city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                <Field label="Postal code" id="postal_code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required />
                <div className="sm:col-span-2">
                  <Field label="Country" id="country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-6 font-display text-2xl">Payment</h2>
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
                This is a demo store — no card is charged. Your order will be
                saved to your account.
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl">Your order</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span className="text-foreground/80">
                    {product.name} × {quantity}
                  </span>
                  <span>{formatPrice(product.price * quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-xl">
                <dt>Total</dt>
                <dd className="text-primary">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-8 w-full rounded-full"
            >
              {submitting ? "Placing order…" : "Place order"}
            </Button>
          </aside>
        </form>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-2"
      />
    </div>
  );
}
