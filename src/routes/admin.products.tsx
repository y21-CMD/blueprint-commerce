import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  short: string;
  description: string;
};

const empty: Omit<Product, "id"> = {
  name: "",
  category: "Journals",
  price: 0,
  image: "",
  short: "",
  description: "",
};

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Product[]);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      price: Number(p.price),
      image: p.image ?? "",
      short: p.short,
      description: p.description,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    setSaving(true);
    const payload = { ...form, price: Number(form.price) || 0 };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Product updated" : "Product added");
    setOpen(false);
    load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      load();
    }
  };

  return (
    <AdminLayout title="Products">
      <div className="mb-6 flex justify-end">
        <Button onClick={openNew} className="bg-[var(--gold)] text-[var(--ink)] hover:bg-[var(--gold-deep)]">
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items === null ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{p.short}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="font-medium">{formatPrice(Number(p.price))}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">
              {editing ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" value={form.image ?? ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="short">Short description</Label>
              <Input id="short" value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}
              className="bg-[var(--gold)] text-[var(--ink)] hover:bg-[var(--gold-deep)]">
              {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
