import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export const approveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");

    const { data: order, error: e1 } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
      })
      .eq("id", data.orderId)
      .select("id, user_id")
      .single();
    if (e1 || !order) throw new Error(e1?.message ?? "Order not found");

    // Notify customer via messaging
    await supabaseAdmin.from("messages").insert({
      customer_id: order.user_id,
      sender_id: context.userId,
      sender_is_admin: true,
      body: `✅ Your payment for order #${order.id.slice(0, 8)} has been approved. Status: Paid.`,
    });
    return { ok: true };
  });

export const rejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        reason: z.string().trim().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");

    const { data: order, error: e1 } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", data.orderId)
      .select("id, user_id")
      .single();
    if (e1 || !order) throw new Error(e1?.message ?? "Order not found");

    await supabaseAdmin.from("messages").insert({
      customer_id: order.user_id,
      sender_id: context.userId,
      sender_is_admin: true,
      body: `❌ Your payment for order #${order.id.slice(0, 8)} was rejected. Reason: ${data.reason}`,
    });
    return { ok: true };
  });

export const getReceiptSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ path: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    // Owner of the file OR admin
    const isAdminUser = await isAdmin(context.userId);
    if (!isAdminUser) {
      const folder = data.path.split("/")[0];
      if (folder !== context.userId) throw new Error("Forbidden");
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("payment-receipts")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error(error?.message ?? "Failed");
    return { url: signed.signedUrl };
  });
