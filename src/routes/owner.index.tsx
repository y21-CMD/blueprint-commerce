import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Crown, Loader2, Search, Trash2, Ban, ShieldCheck, KeyRound, Mail, UserCog } from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  listAllUsers,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
  grantRole,
  revokeRole,
  setUserBlocked,
  type OwnerUser,
} from "@/lib/owner.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/owner/")({
  head: () => ({ meta: [{ title: "Owner Control Center" }] }),
  component: OwnerControlCenter,
});

type EditMode = null | { kind: "email" | "password"; user: OwnerUser };

function OwnerControlCenter() {
  const { isOwner, loading, user } = useIsOwner();
  const navigate = useNavigate();

  const fetchUsers = useServerFn(listAllUsers);
  const fnUpdateEmail = useServerFn(updateUserEmail);
  const fnUpdatePassword = useServerFn(updateUserPassword);
  const fnDelete = useServerFn(deleteUserAccount);
  const fnGrant = useServerFn(grantRole);
  const fnRevoke = useServerFn(revokeRole);
  const fnBlock = useServerFn(setUserBlocked);

  const [users, setUsers] = useState<OwnerUser[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<EditMode>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/owner" } });
    } else if (isOwner === false) {
      navigate({ to: "/" });
    }
  }, [loading, user, isOwner, navigate]);

  const reload = async () => {
    try {
      const { users } = await fetchUsers();
      setUsers(users);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load users");
    }
  };

  useEffect(() => {
    if (isOwner) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users, query]);

  const counts = useMemo(() => {
    const c = { total: 0, owners: 0, admins: 0, blocked: 0 };
    (users ?? []).forEach((u) => {
      c.total += 1;
      if (u.roles.includes("owner")) c.owners += 1;
      else if (u.roles.includes("admin")) c.admins += 1;
      if (u.is_blocked) c.blocked += 1;
    });
    return c;
  }, [users]);

  if (loading || !isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Verifying owner access…
      </div>
    );
  }

  const wrap = async <T,>(id: string, fn: () => Promise<T>, ok?: string) => {
    setWorking(id);
    try {
      await fn();
      if (ok) toast.success(ok);
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setWorking(null);
    }
  };

  const onSaveEdit = async () => {
    if (!edit) return;
    if (edit.kind === "email") {
      if (!/^\S+@\S+\.\S+$/.test(editValue)) return toast.error("Enter a valid email");
      await wrap(edit.user.id, () => fnUpdateEmail({ data: { userId: edit.user.id, email: editValue } }), "Email updated");
    } else {
      if (editValue.length < 8) return toast.error("Password must be at least 8 characters");
      await wrap(edit.user.id, () => fnUpdatePassword({ data: { userId: edit.user.id, password: editValue } }), "Password updated");
    }
    setEdit(null);
    setEditValue("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-sage text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold)]/20">
              <Crown className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary-foreground/60">
                Restricted Access
              </p>
              <h1 className="font-display text-2xl text-[var(--gold)]">Owner Control Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-primary-foreground/70">
            <span className="hidden sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Site
            </Button>
            <Link to="/admin">
              <Button size="sm" variant="outline" className="border-[var(--gold)]/40 bg-transparent text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total users", value: counts.total },
            { label: "Owners", value: counts.owners },
            { label: "Admins", value: counts.admins },
            { label: "Blocked", value: counts.blocked },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4 shadow-soft">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, name, or ID…"
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={reload} disabled={working === "reload"}>
            Refresh
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users === null ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading users…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const isOwnerRow = u.roles.includes("owner");
                  const isAdminRow = u.roles.includes("admin");
                  const isSelf = u.id === user?.id;
                  const busy = working === u.id;
                  return (
                    <TableRow key={u.id} className={u.is_blocked ? "bg-destructive/5" : undefined}>
                      <TableCell>
                        <div className="font-medium">{u.full_name || "—"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{u.id.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">none</span>
                          ) : (
                            u.roles.map((r) => (
                              <Badge
                                key={r}
                                variant="outline"
                                className={
                                  r === "owner"
                                    ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-deep)]"
                                    : r === "admin"
                                      ? "border-primary/40 text-primary"
                                      : ""
                                }
                              >
                                {r === "owner" && <Crown className="mr-1 h-3 w-3" />}
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
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEdit({ kind: "email", user: u });
                              setEditValue(u.email ?? "");
                            }}
                            disabled={busy}
                            title="Edit email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEdit({ kind: "password", user: u });
                              setEditValue("");
                            }}
                            disabled={busy}
                            title="Set password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          {!isOwnerRow && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                wrap(
                                  u.id,
                                  () =>
                                    isAdminRow
                                      ? fnRevoke({ data: { userId: u.id, role: "admin" } })
                                      : fnGrant({ data: { userId: u.id, role: "admin" } }),
                                  isAdminRow ? "Admin role removed" : "Admin role granted",
                                )
                              }
                              title={isAdminRow ? "Demote from admin" : "Promote to admin"}
                            >
                              <UserCog className="mr-1 h-3.5 w-3.5" />
                              {isAdminRow ? "Demote" : "Make admin"}
                            </Button>
                          )}
                          {!isOwnerRow && (
                            <Button
                              size="sm"
                              variant={u.is_blocked ? "outline" : "destructive"}
                              disabled={busy}
                              onClick={() => {
                                if (
                                  !confirm(
                                    u.is_blocked
                                      ? `Unblock ${u.email ?? u.id.slice(0, 8)}?`
                                      : `Block ${u.email ?? u.id.slice(0, 8)}? They will be signed out and can't log in.`,
                                  )
                                )
                                  return;
                                wrap(
                                  u.id,
                                  () => fnBlock({ data: { userId: u.id, blocked: !u.is_blocked } }),
                                  u.is_blocked ? "User unblocked" : "User blocked",
                                );
                              }}
                            >
                              {u.is_blocked ? (
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                              ) : (
                                <Ban className="mr-1 h-3.5 w-3.5" />
                              )}
                              {u.is_blocked ? "Unblock" : "Ban"}
                            </Button>
                          )}
                          {!isOwnerRow && !isSelf && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busy}
                              onClick={() => {
                                if (!confirm(`Permanently delete ${u.email ?? u.id}? This cannot be undone.`)) return;
                                wrap(
                                  u.id,
                                  () => fnDelete({ data: { userId: u.id } }),
                                  "User deleted",
                                );
                              }}
                              title="Delete account"
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?.kind === "email" ? "Change email" : "Set new password"} — {edit?.user.email ?? edit?.user.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{edit?.kind === "email" ? "New email" : "New password (min 8 chars)"}</Label>
            <Input
              type={edit?.kind === "password" ? "text" : "email"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={edit?.kind === "email" ? "user@example.com" : "Enter new password"}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} disabled={working === edit?.user.id}>
              {working === edit?.user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
