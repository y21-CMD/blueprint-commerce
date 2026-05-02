import { createFileRoute, Link } from "@tanstack/react-router";
import { Ship, Globe2, Package, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import heroImg from "@/assets/hero-cargo-ship.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My-Sea International — Stationery Import & Export" },
      {
        name: "description",
        content:
          "Global stationery trading. Premium imported paper goods and East-African exports, shipped worldwide via sea freight.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useProducts();
  const featured = (products ?? []).slice(0, 3);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Cargo ship loaded with shipping containers crossing the open ocean at golden hour"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--royal-deep)]/90 via-[var(--royal-deep)]/70 to-[var(--royal-deep)]/30" />
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-36 md:pb-44">
          <div className="max-w-2xl text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--gold)]">
              Global Stationery Trade
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
              Premium paper goods,
              <br />
              <em className="text-[var(--gold)]">shipped worldwide.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80">
              My-Sea International sources fine stationery from artisan makers across
              the globe and exports East-African paper craft to buyers worldwide.
              Sea freight, customs, and B2B distribution — handled end to end.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[var(--gold)] px-8 text-[var(--ink)] hover:bg-[var(--gold-deep)]"
              >
                <Link to="/catalog">Browse the catalog</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/5 px-8 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/contact">B2B inquiries →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trade pillars */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Ship, t: "Sea Freight", d: "FCL & LCL container shipping to 60+ ports." },
          { icon: Globe2, t: "Global Sourcing", d: "Direct partnerships with makers in 20+ countries." },
          { icon: Package, t: "Warehousing", d: "Bonded storage and just-in-time fulfillment." },
          { icon: ShieldCheck, t: "Customs & Docs", d: "End-to-end clearance, HS coding, certificates." },
        ].map((b) => (
          <div key={b.t} className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--gold)]/15 text-[var(--gold-deep)]">
              <b.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-xl text-primary">{b.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold-deep)]">
              The catalog
            </p>
            <h2 className="mt-3 font-display text-4xl text-primary md:text-5xl">
              Latest arrivals
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden text-sm text-primary underline-offset-4 hover:underline md:block"
          >
            View everything
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">Catalog updates loading…</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-3">
            {featured.map((p) => (
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
        )}
      </section>

      {/* Story strip */}
      <section className="bg-gradient-sage py-24 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]/80">
            Where craft meets commerce
          </p>
          <p className="mt-6 font-display text-3xl leading-snug md:text-4xl">
            “We move premium stationery between continents — quietly, reliably,
            container by container.”
          </p>
          <p className="mt-6 text-sm opacity-80">— My-Sea Trading Desk</p>
        </div>
      </section>
    </SiteLayout>
  );
}
