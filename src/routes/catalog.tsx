import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

const TRADE_TABS = ["All", "Imported", "Exported"] as const;
type Tab = (typeof TRADE_TABS)[number];

const CATEGORIES = ["All", "Journals", "Writing", "Cards", "Paper", "Sealing"] as const;

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — My-Sea International" },
      {
        name: "description",
        content:
          "Browse our imported and exported stationery — journals, pens, cards, papers, and sealing wax.",
      },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { data: products, isLoading } = useProducts();
  const [tab, setTab] = useState<Tab>("All");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (tab !== "All") {
        const want = tab === "Imported" ? "imported" : "exported";
        if (p.trade_type !== want) return false;
      }
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.short ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, tab, category, query]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold-deep)]">
            The catalog
          </p>
          <h1 className="mt-4 font-display text-5xl text-primary md:text-6xl">
            Imported & Exported.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Premium stationery sourced from global makers, plus East-African paper craft
            ready for export. Updated live as we land new shipments.
          </p>
        </div>

        {/* Trade type tabs */}
        <div className="mb-8 inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
          {TRADE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-smooth",
                tab === t
                  ? "bg-[var(--royal-deep)] text-white shadow-soft"
                  : "text-muted-foreground hover:text-primary",
              )}
            >
              {t === "All" ? "All Products" : `${t} Products`}
            </button>
          ))}
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
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-smooth",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-[var(--gold)] hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="font-display text-2xl text-primary">No matches.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search, category, or trade type.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
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
          </>
        )}
      </section>
    </SiteLayout>
  );
}
