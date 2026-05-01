import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
};
type RoleRow = { user_id: string; role: string };

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: UsersAdmin,
});

function UsersAdmin() {
  const [rows, setRows] = useState<(ProfileRow & { roles: string[] })[] | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) toast.error(pe.message);
      if (re) toast.error(re.message);
      const byUser = new Map<string, string[]>();
      ((roles ?? []) as RoleRow[]).forEach((r) => {
        byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
      });
      setRows(((profiles ?? []) as ProfileRow[]).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] })));
    })();
  }, []);

  return (
    <AdminLayout title="Users">
      <div className="rounded-lg border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">No users yet.</TableCell></TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.id.slice(0, 8)}…</TableCell>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
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
