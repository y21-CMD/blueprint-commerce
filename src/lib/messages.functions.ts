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

export type AdminThread = {
  customer_id: string;
  email: string | null;
  full_name: string | null;
  last_body: string;
  last_at: string;
  unread: number;
};

export const listAdminThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");

    const { data: msgs, error } = await supabaseAdmin
      .from("messages")
      .select("customer_id, body, created_at, sender_is_admin, read_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);

    const threads = new Map<string, AdminThread>();
    for (const m of msgs ?? []) {
      const cur = threads.get(m.customer_id);
      if (!cur) {
        threads.set(m.customer_id, {
          customer_id: m.customer_id,
          email: null,
          full_name: null,
          last_body: m.body,
          last_at: m.created_at,
          unread: !m.sender_is_admin && !m.read_at ? 1 : 0,
        });
      } else if (!m.sender_is_admin && !m.read_at) {
        cur.unread += 1;
      }
    }

    const ids = Array.from(threads.keys());
    if (ids.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      // Get emails via auth admin
      for (const id of ids) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        const t = threads.get(id)!;
        t.email = u.user?.email ?? null;
        const p: any = profMap.get(id);
        t.full_name = p?.full_name ?? null;
      }
    }

    return {
      threads: Array.from(threads.values()).sort((a, b) =>
        a.last_at < b.last_at ? 1 : -1,
      ),
    };
  });

export const adminSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        customer_id: z.string().uuid(),
        body: z.string().trim().min(1).max(5000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("messages").insert({
      customer_id: data.customer_id,
      sender_id: context.userId,
      sender_is_admin: true,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMarkThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ customer_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    await supabaseAdmin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("customer_id", data.customer_id)
      .eq("sender_is_admin", false)
      .is("read_at", null);
    return { ok: true };
  });
