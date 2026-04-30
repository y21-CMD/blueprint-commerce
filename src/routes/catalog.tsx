import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { products, categories } from "@/data/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Shop — Lestationery" },
      {
        name: "description",
        content:
          "Browse hand-bound journals, brass pens, letterpress cards, and wax seals.",
      },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const filtered =
    active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            The shop
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary md:text-6xl">
            Every quiet thing.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Our complete collection. Made by hand, in small batches.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-smooth",
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-primary/40 hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
