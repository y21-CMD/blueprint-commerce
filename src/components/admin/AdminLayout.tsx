import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { to: "/admin/users", label: "User Management", icon: Users, exact: false },
  { to: "/admin/messages", label: "Messages", icon: Mail, exact: false },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { isAdmin, loading, user } = useIsAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
    } else if (isAdmin === false) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, isAdmin, navigate, pathname]);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-gradient-sage text-primary-foreground md:flex">
        <div className="px-6 py-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary-foreground/60">
            My-Sea International
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--gold)]">
            Admin
          </h2>
        </div>
        <nav className="flex-1 px-3">
          {items.map((it) => {
            const active = it.exact
              ? pathname === it.to
              : pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-smooth",
                  active
                    ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/5",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-primary-foreground/10 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to site
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-5 md:px-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Admin
              </p>
              <h1 className="mt-1 font-display text-3xl text-primary">
                {title}
              </h1>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Signed in as</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border bg-card px-3 py-2 md:hidden">
            {items.map((it) => {
              const active = it.exact
                ? pathname === it.to
                : pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-xs",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
