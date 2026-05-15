import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

type Message = {
  id: string;
  body: string;
  sender_is_admin: boolean;
  created_at: string;
  read_at: string | null;
};

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — My-Sea International" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, body, sender_is_admin, created_at, read_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as Message[]);
      // Mark admin msgs as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("customer_id", user.id)
        .eq("sender_is_admin", true)
        .is("read_at", null);
    };
    load();

    const channel = supabase
      .channel(`messages-thread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((m) => [...m, payload.new as Message]);
          if ((payload.new as Message).sender_is_admin) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", (payload.new as Message).id)
              .then();
          }
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    if (!user || !input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    const { error } = await supabase.from("messages").insert({
      customer_id: user.id,
      sender_id: user.id,
      sender_is_admin: false,
      body,
    });
    if (error) {
      toast.error(error.message);
      setInput(body);
    }
    setSending(false);
  };

  if (loading || !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-6 py-32 text-center text-muted-foreground">
          {loading ? "Loading…" : "Please sign in to view your messages."}
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-24">
        <h1 className="mb-2 font-display text-4xl text-primary">Messages</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Talk directly with our team. Replies appear here in real time.
        </p>
        <div className="rounded-lg border border-border bg-card shadow-soft">
          <div
            ref={scrollRef}
            className="h-[480px] overflow-y-auto px-6 py-6"
          >
            {messages.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex ${m.sender_is_admin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.sender_is_admin
                          ? "bg-secondary text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${m.sender_is_admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}
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
            )}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
