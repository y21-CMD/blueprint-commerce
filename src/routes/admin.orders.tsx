import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_city: string;
  shipping_country: string;
  user_id: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, status, total, shipping_name, shipping_email, shipping_city, shipping_country, user_id, order_items(id, product_name, quantity, unit_price)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setOrders((data ?? []) as Order[]);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      setOrders((cur) => cur?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    }
  };

  return (
    <AdminLayout title="Orders">
      <div className="rounded-lg border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders === null ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
            ) : (
              orders.map((o) => (
                <Fragment key={o.id}>
                  <TableRow className="cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    <TableCell>
                      {expanded === o.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <p className="font-medium">{o.shipping_name}</p>
                      <p className="text-xs text-muted-foreground">{o.shipping_email}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(Number(o.total))}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  {expanded === o.id && (
                    <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                      <TableCell></TableCell>
                      <TableCell colSpan={5} className="py-4">
                        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Ship to {o.shipping_city}, {o.shipping_country}
                        </p>
                        <ul className="space-y-1 text-sm">
                          {o.order_items.map((it) => (
                            <li key={it.id} className="flex justify-between">
                              <span>{it.product_name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                              <span>{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
