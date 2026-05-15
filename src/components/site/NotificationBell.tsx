import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .eq("sender_is_admin", true)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel(`messages-bell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label="Messages"
      className="relative"
    >
      <Link to="/messages">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </Link>
    </Button>
  );
}
