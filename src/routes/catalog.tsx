import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
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
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = active === "All" || p.category === active;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [active, query]);

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

        {/* Search */}
        <div className="relative mb-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journals, pens, paper…"
            className="h-12 rounded-full border-border bg-card pl-11 pr-11 text-sm shadow-soft focus-visible:ring-accent"
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-smooth hover:bg-muted hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="mb-12 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-smooth",
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-accent hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="font-display text-2xl text-primary">No matches.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search or category.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </p>
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  );
}
