import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Block check
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_blocked")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.is_blocked) throw new Error("Your account is blocked.");

    // Re-fetch authoritative prices
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, image")
      .in("id", ids);
    if (pErr) throw new Error("Failed to load products.");

    const priceMap = new Map(products!.map((p) => [p.id, p]));
    let subtotal = 0;
    const items = data.items.map((i) => {
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
        shipping_name: data.shipping.name,
        shipping_email: data.shipping.email,
        shipping_address: data.shipping.address,
        shipping_city: data.shipping.city,
        shipping_postal_code: data.shipping.postal_code,
        shipping_country: data.shipping.country,
        status: "paid",
      })
      .select()
      .single();
    if (oErr || !order) throw new Error("Could not create order.");

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((it) => ({ ...it, order_id: order.id })));
    if (iErr) throw new Error("Could not create order items.");

    return { orderId: order.id, subtotal, shipping, total };
  });
