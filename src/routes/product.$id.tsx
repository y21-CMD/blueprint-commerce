import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [{ title: "Product — My-Sea International" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: all } = useProducts();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-6 py-32 text-center text-muted-foreground">
          Loading…
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-6 py-32 text-center">
          <h1 className="font-display text-4xl text-primary">Not found</h1>
          <p className="mt-3 text-muted-foreground">
            That product seems to have wandered off.
          </p>
          <Button asChild className="mt-8">
            <Link to="/catalog">Back to the catalog</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const related = (all ?? []).filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <SiteLayout>
      <article className="mx-auto grid max-w-7xl gap-12 px-6 pt-12 pb-24 md:grid-cols-2 md:gap-20 md:pt-20">
        <div className="relative overflow-hidden rounded-lg bg-secondary/40">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <span
            className={
              "absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] shadow-soft " +
              (product.trade_type === "exported"
                ? "bg-[var(--gold)] text-[var(--ink)]"
                : "bg-[var(--royal-deep)] text-white")
            }
          >
            {product.trade_type === "exported" ? "Export Product" : "Import Product"}
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {product.category}
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary">{product.name}</h1>
          <p className="mt-4 font-display text-2xl text-foreground/80">
            {formatPrice(Number(product.price))}
          </p>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            {product.description || product.short}
          </p>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 text-foreground/70 hover:text-primary"
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-8 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="p-3 text-foreground/70 hover:text-primary"
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1 rounded-full"
              onClick={() => {
                add(
                  {
                    id: product.id,
                    name: product.name,
                    category: product.category,
                    price: Number(product.price),
                    image: product.image ?? "",
                    short: product.short,
                    description: product.description,
                    trade_type: product.trade_type,
                  },
                  qty,
                );
                toast.success(`${product.name} added to cart`);
              }}
            >
              Add to cart
            </Button>
          </div>

          <ul className="mt-10 space-y-3 border-t border-border pt-8 text-sm text-muted-foreground">
            <li>· Worldwide sea freight available</li>
            <li>· B2B wholesale pricing on request</li>
            <li>· Returns accepted within 30 days</li>
          </ul>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <h2 className="mb-10 font-display text-3xl">You may also like</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  price: Number(p.price),
                  image: p.image ?? "",
                  short: p.short,
                  trade_type: p.trade_type,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
