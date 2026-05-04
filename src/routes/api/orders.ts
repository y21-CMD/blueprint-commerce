import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  shipping: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    address: z.string().trim().min(1).max(255),
    city: z.string().trim().min(1).max(120),
    postal_code: z.string().trim().min(1).max(40),
    country: z.string().trim().min(1).max(120),
  }),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return json({ error: "Unauthorized" }, 401);
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const userClient = createClient<Database>(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: claims, error: claimsErr } =
          await userClient.auth.getClaims(token);
        if (claimsErr || !claims?.claims?.sub) {
          return json({ error: "Unauthorized" }, 401);
        }
        const userId = claims.claims.sub;

        let parsed: z.infer<typeof inputSchema>;
        try {
          parsed = inputSchema.parse(await request.json());
        } catch {
          return json({ error: "Invalid input" }, 400);
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("is_blocked")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.is_blocked) {
          return json({ error: "Your account is blocked." }, 403);
        }

        const ids = parsed.items.map((i) => i.product_id);
        const { data: products, error: pErr } = await supabaseAdmin
          .from("products")
          .select("id, name, price, image")
          .in("id", ids);
        if (pErr || !products) {
          return json({ error: "Failed to load products." }, 500);
        }

        const priceMap = new Map(products.map((p) => [p.id, p]));
        let subtotal = 0;
        const items = parsed.items.map((i) => {
          const p = priceMap.get(i.product_id);
          if (!p) throw new Error(`Product not found: ${i.product_id}`);
          subtotal += Number(p.price) * i.quantity;
          return {
            product_id: p.id,
            product_name: p.name,
            product_image: p.image,
            unit_price: Number(p.price),
            quantity: i.quantity,
          };
        });
        const shipping = subtotal > 80 || subtotal === 0 ? 0 : 8;
        const total = subtotal + shipping;

        const { data: order, error: oErr } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            subtotal,
            shipping,
            total,
            shipping_name: parsed.shipping.name,
            shipping_email: parsed.shipping.email,
            shipping_address: parsed.shipping.address,
            shipping_city: parsed.shipping.city,
            shipping_postal_code: parsed.shipping.postal_code,
            shipping_country: parsed.shipping.country,
            status: "paid",
          })
          .select()
          .single();
        if (oErr || !order) {
          return json({ error: "Could not create order." }, 500);
        }

        const { error: iErr } = await supabaseAdmin
          .from("order_items")
          .insert(items.map((it) => ({ ...it, order_id: order.id })));
        if (iErr) {
          return json({ error: "Could not create order items." }, 500);
        }

        return json({ orderId: order.id, subtotal, shipping, total });
      },
    },
  },
});
