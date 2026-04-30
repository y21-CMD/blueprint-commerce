import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import heroImg from "@/assets/hero-stationery.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lestationery — Hand-bound paper goods" },
      {
        name: "description",
        content:
          "Quietly made journals, pens, letterpress cards and wax seals from a small studio.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = products.slice(0, 3);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pt-12 pb-20 md:grid-cols-2 md:gap-16 md:pt-20 md:pb-32">
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Made slowly · Stockholm
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-primary md:text-7xl">
              For the quiet
              <br />
              <em className="text-accent">art</em> of writing.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Hand-bound journals, brass pens, and pressed letterpress cards.
              Small batches, considered materials, made for letters worth
              keeping.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/catalog">Shop the collection</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-full px-8"
              >
                <Link to="/about">Our story →</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-2xl bg-gradient-warm" />
            <img
              src={heroImg}
              alt="Sage leather journal, brass fountain pen, and wax seal on cream linen"
              width={1600}
              height={1200}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-elevated md:aspect-[5/6]"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              The collection
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              New arrivals
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden text-sm text-primary underline-offset-4 hover:underline md:block"
          >
            View everything
          </Link>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Story strip */}
      <section className="bg-gradient-sage py-24 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">
            A small studio
          </p>
          <p className="mt-6 font-display text-3xl leading-snug md:text-4xl">
            “We bind every journal by hand, in a quiet room, with paper that
            remembers the weight of a pen.”
          </p>
          <p className="mt-6 text-sm opacity-80">— Elin, founder</p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-3">
        {[
          {
            t: "Hand-bound",
            d: "Every journal is sewn and finished by hand in our Stockholm studio.",
          },
          {
            t: "Considered paper",
            d: "Acid-free cotton paper that takes ink without bleed and ages beautifully.",
          },
          {
            t: "Small batches",
            d: "Released in limited runs so each piece keeps its quiet, deliberate feel.",
          },
        ].map((b) => (
          <div key={b.t}>
            <h3 className="font-display text-2xl text-primary">{b.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {b.d}
            </p>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
