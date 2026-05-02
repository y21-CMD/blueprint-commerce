import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-stationery.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — My-Sea International" },
      {
        name: "description",
        content:
          "A small Stockholm studio binding journals and pressing cards by hand.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Our story
        </p>
        <h1 className="mt-4 font-display text-5xl text-primary md:text-6xl">
          A quiet studio in Stockholm.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          My-Sea International began with a single linen-bound notebook and a borrowed
          letterpress. Today, we're still small — a studio of three, a press,
          and a great deal of patience.
        </p>
      </section>

      <img
        src={heroImg}
        alt="The My-Sea International studio"
        className="mx-auto mt-8 aspect-[16/8] max-w-5xl rounded-2xl object-cover px-6"
        loading="lazy"
      />

      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-primary">Slow by design</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We make in small batches — a few dozen journals at a time — so that
            every stitch and every press feels considered. It costs us speed,
            but it gives our work a quietness we love.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl text-primary">Honest materials</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Acid-free cotton paper, vegetable-tanned leather, brass, beeswax.
            Materials that age with you, that take ink without bleed, that
            soften with use.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/catalog">Visit the shop</Link>
        </Button>
      </section>
    </SiteLayout>
  );
}
