import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import {
  listAdminThreads,
  adminSendMessage,
  adminMarkThreadRead,
  type AdminThread,
} from "@/lib/messages.functions";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  sender_is_admin: boolean;
  created_at: string;
};

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Admin" }] }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useServerFn(listAdminThreads);
  const sendMsg = useServerFn(adminSendMessage);
  const markRead = useServerFn(adminMarkThreadRead);

  const loadThreads = async () => {
    try {
      const { threads } = await fetchThreads();
      setThreads(threads);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    loadThreads();
    const channel = supabase
      .channel("admin-messages-all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadThreads(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_is_admin, created_at")
        .eq("customer_id", active)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as Message[]);
      try {
        await markRead({ data: { customer_id: active } });
      } catch {}
      loadThreads();
    };
    load();
    const channel = supabase
      .channel(`admin-thread-${active}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${active}`,
        },
        (payload) => setMessages((m) => [...m, payload.new as Message]),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    if (!active || !input.trim()) return;
    const body = input.trim();
    setInput("");
    try {
      await sendMsg({ data: { customer_id: active, body } });
    } catch (e: any) {
      toast.error(e.message);
      setInput(body);
    }
  };

  return (
    <AdminLayout title="Messages">
      <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <aside className="overflow-y-auto rounded-lg border border-border bg-card">
          {threads.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul>
              {threads.map((t) => (
                <li key={t.customer_id}>
                  <button
                    onClick={() => setActive(t.customer_id)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left transition-smooth hover:bg-secondary/40",
                      active === t.customer_id && "bg-secondary/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {t.full_name || t.email || t.customer_id.slice(0, 8)}
                      </p>
                      {t.unread > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {t.last_body}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(t.last_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex flex-col rounded-lg border border-border bg-card">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
                <ul className="space-y-3">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`flex ${m.sender_is_admin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.sender_is_admin
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${m.sender_is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder="Reply…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button onClick={send} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
