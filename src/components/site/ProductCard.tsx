import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="overflow-hidden rounded-lg bg-secondary/40">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-smooth group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-display text-xl text-foreground">
            {product.name}
          </h3>
        </div>
        <span className="font-display text-lg text-primary">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
