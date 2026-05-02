import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  short: string;
  description: string;
  trade_type: "imported" | "exported";
  created_at: string;
};

export const PRODUCTS_KEY = ["products"] as const;

async function fetchProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbProduct[];
}

/**
 * Fetches products and subscribes to realtime changes so the UI updates
 * instantly whenever an admin adds, edits, or deletes a product.
 */
export function useProducts() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: fetchProducts,
  });

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useProduct(id: string | undefined) {
  const all = useProducts();
  return {
    ...all,
    data: id ? all.data?.find((p) => p.id === id) : undefined,
  };
}
