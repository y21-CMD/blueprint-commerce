import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getProduct, products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { ProductCard } from "@/components/site/ProductCard";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Product"} — Lestationery` },
      {
        name: "description",
        content: loaderData?.product.short ?? "",
      },
      {
        property: "og:image",
        content: loaderData?.product.image ?? "",
      },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl text-primary">Not found</h1>
        <p className="mt-3 text-muted-foreground">
          That product seems to have wandered off.
        </p>
        <Button asChild className="mt-8">
          <Link to="/catalog">Back to the shop</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <Button asChild className="mt-8">
          <Link to="/catalog">Back to the shop</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const related = products.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <SiteLayout>
      <article className="mx-auto grid max-w-7xl gap-12 px-6 pt-12 pb-24 md:grid-cols-2 md:gap-20 md:pt-20">
        <div className="overflow-hidden rounded-lg bg-secondary/40">
          <img
            src={product.image}
            alt={product.name}
            width={800}
            height={1000}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {product.category}
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-2xl text-foreground/80">
            {formatPrice(product.price)}
          </p>
          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            {product.description}
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
                add(product, qty);
                toast.success(`${product.name} added to cart`);
              }}
            >
              Add to cart
            </Button>
          </div>

          <ul className="mt-10 space-y-3 border-t border-border pt-8 text-sm text-muted-foreground">
            <li>· Hand-finished in Stockholm</li>
            <li>· Free shipping on orders over $80</li>
            <li>· Returns accepted within 30 days</li>
          </ul>
        </div>
      </article>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="mb-10 font-display text-3xl">You may also like</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
