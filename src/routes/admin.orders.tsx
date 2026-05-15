import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Check, X, FileText } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  approveOrder,
  rejectOrder,
  getReceiptSignedUrl,
} from "@/lib/payments.functions";

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
  payment_method: string | null;
  payment_ref: string | null;
  payment_receipt_path: string | null;
  payment_notes: string | null;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const BANK_LABELS: Record<string, string> = {
  cbe: "CBE",
  telebirr: "Telebirr",
  boa: "BOA",
  abay: "Abay Bank",
};

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const approve = useServerFn(approveOrder);
  const reject = useServerFn(rejectOrder);
  const getUrl = useServerFn(getReceiptSignedUrl);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, created_at, status, total, shipping_name, shipping_email, shipping_city, shipping_country, user_id, payment_method, payment_ref, payment_receipt_path, payment_notes, order_items(id, product_name, quantity, unit_price)",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      setOrders((cur) => cur?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approve({ data: { orderId: id } });
      toast.success("Order approved — customer notified.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejecting this payment?");
    if (!reason?.trim()) return;
    try {
      await reject({ data: { orderId: id, reason: reason.trim() } });
      toast.success("Order rejected.");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const viewReceipt = async (path: string) => {
    try {
      const { url } = await getUrl({ data: { path } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message);
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
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders === null ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
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
                    <TableCell className="text-xs">
                      {o.payment_method ? BANK_LABELS[o.payment_method] : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                        <SelectTrigger className="h-8 w-32">
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
                      <TableCell colSpan={6} className="py-4">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Ship to {o.shipping_city}, {o.shipping_country}
                            </p>
                            <ul className="space-y-1 text-sm">
                              {o.order_items.map((it) => (
                                <li key={it.id} className="flex justify-between">
                                  <span>
                                    {it.product_name}{" "}
                                    <span className="text-muted-foreground">× {it.quantity}</span>
                                  </span>
                                  <span>{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-md border border-border bg-card p-4">
                            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Payment proof
                            </p>
                            <p className="text-sm">
                              <strong>Method:</strong>{" "}
                              {o.payment_method ? BANK_LABELS[o.payment_method] : "—"}
                            </p>
                            {o.payment_ref && (
                              <p className="text-sm">
                                <strong>Ref:</strong>{" "}
                                <span className="font-mono">{o.payment_ref}</span>
                              </p>
                            )}
                            {o.payment_receipt_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => viewReceipt(o.payment_receipt_path!)}
                              >
                                <FileText className="mr-2 h-3.5 w-3.5" />
                                View receipt
                              </Button>
                            )}
                            {o.status === "pending" && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(o.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(o.id)}
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
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
