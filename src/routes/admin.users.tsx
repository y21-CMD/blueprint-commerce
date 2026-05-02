import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ban, ShieldCheck, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  full_name: string | null;
  is_blocked: boolean;
  created_at: string;
};
type RoleRow = { user_id: string; role: string };
type UserRow = ProfileRow & { roles: string[] };

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Admin" }] }),
  component: UsersAdmin,
});

function UsersAdmin() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    const [{ data: profiles, error: pe }, { data: roles, error: re }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, is_blocked, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
    if (pe) toast.error(pe.message);
    if (re) toast.error(re.message);
    const byUser = new Map<string, string[]>();
    ((roles ?? []) as RoleRow[]).forEach((r) => {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    });
    setRows(
      ((profiles ?? []) as ProfileRow[]).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      })),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u: UserRow) => {
    if (u.roles.includes("admin")) {
      toast.error("You can't block another admin.");
      return;
    }
    const next = !u.is_blocked;
    if (
      !confirm(
        next
          ? `Block ${u.full_name || u.id.slice(0, 8)}? They will be signed out and unable to log in.`
          : `Unblock ${u.full_name || u.id.slice(0, 8)}?`,
      )
    )
      return;
    setWorking(u.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: next })
      .eq("id", u.id);
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "User blocked" : "User unblocked");
    load();
  };

  return (
    <AdminLayout title="User Management">
      <div className="rounded-lg border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id} className={u.is_blocked ? "bg-destructive/5" : undefined}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {u.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">none</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className={
                              r === "admin"
                                ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-deep)]"
                                : ""
                            }
                          >
                            {r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.is_blocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={u.is_blocked ? "outline" : "destructive"}
                      onClick={() => toggleBlock(u)}
                      disabled={working === u.id || u.roles.includes("admin")}
                    >
                      {working === u.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : u.is_blocked ? (
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {u.is_blocked ? "Unblock" : "Block"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
