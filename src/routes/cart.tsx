import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — My-Sea International" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const shipping = subtotal > 80 || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-6 py-32 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Your cart
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary">
            Quietly empty.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Nothing here yet. Wander the shop and find something worth keeping.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8">
            <Link to="/catalog">Shop the collection</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <h1 className="mb-12 font-display text-5xl text-primary">Your cart</h1>
        <div className="grid gap-12 md:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-border">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-6 py-6">
                <Link
                  to="/product/$id"
                  params={{ id: product.id }}
                  className="block w-24 shrink-0 overflow-hidden rounded-md bg-secondary/40 sm:w-28"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="aspect-square w-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {product.category}
                      </p>
                      <Link
                        to="/product/$id"
                        params={{ id: product.id }}
                        className="font-display text-xl"
                      >
                        {product.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => remove(product.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button
                        onClick={() => setQty(product.id, quantity - 1)}
                        className="p-2 text-foreground/70 hover:text-primary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-8 text-center text-sm">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQty(product.id, quantity + 1)}
                        className="p-2 text-foreground/70 hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-display text-lg text-primary">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-lg border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl">Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 font-display text-xl">
                <dt>Total</dt>
                <dd className="text-primary">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button asChild size="lg" className="mt-8 w-full rounded-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Free shipping over $80
            </p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
