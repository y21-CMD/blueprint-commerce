import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "lestationery-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce(
      (s, i) => s + i.product.price * i.quantity,
      0,
    );
    return {
      items,
      count,
      subtotal,
      add: (product, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.product.id === product.id);
          if (found) {
            return prev.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + qty }
                : i,
            );
          }
          return [...prev, { product, quantity: qty }];
        }),
      remove: (productId) =>
        setItems((prev) => prev.filter((i) => i.product.id !== productId)),
      setQty: (productId, qty) =>
        setItems((prev) =>
          prev
            .map((i) =>
              i.product.id === productId
                ? { ...i, quantity: Math.max(0, qty) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
