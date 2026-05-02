import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";

export type ProductCardProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  short?: string;
  trade_type?: "imported" | "exported";
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-secondary/40">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-smooth group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {product.trade_type && (
          <span
            className={
              "absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] shadow-soft " +
              (product.trade_type === "exported"
                ? "bg-[var(--gold)] text-[var(--ink)]"
                : "bg-[var(--royal-deep)] text-white")
            }
          >
            {product.trade_type === "exported" ? "Export" : "Import"}
          </span>
        )}
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
