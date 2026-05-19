// import { createFileRoute } from "@tanstack/react-router";
// import { useEffect, useRef, useState } from "react";
// import { AdminLayout } from "@/components/admin/AdminLayout";
// import { supabase } from "@/integrations/supabase/client";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { useServerFn } from "@tanstack/react-start";
// import {
//   listAdminThreads,
//   adminSendMessage,
//   adminMarkThreadRead,
//   type AdminThread,
// } from "@/lib/messages.functions";
// import { toast } from "sonner";
// import { Send } from "lucide-react";
// import { cn } from "@/lib/utils";

// type Message = {
//   id: string;
//   body: string;
//   sender_is_admin: boolean;
//   created_at: string;
// };

// export const Route = createFileRoute("/admin/messages")({
//   head: () => ({ meta: [{ title: "Messages — Admin" }] }),
//   component: AdminMessagesPage,
// });

// function AdminMessagesPage() {
//   const [threads, setThreads] = useState<AdminThread[]>([]);
//   const [active, setActive] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const scrollRef = useRef<HTMLDivElement>(null);

//   const fetchThreads = useServerFn(listAdminThreads);
//   const sendMsg = useServerFn(adminSendMessage);
//   const markRead = useServerFn(adminMarkThreadRead);

//   const loadThreads = async () => {
//     try {
//       const { threads } = await fetchThreads();
//       setThreads(threads);
//     } catch (e: any) {
//       toast.error(e.message);
//     }
//   };

//   useEffect(() => {
//     loadThreads();
//     const channel = supabase
//       .channel("admin-messages-all")
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "messages" },
//         () => loadThreads(),
//       )
//       .subscribe();
//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   useEffect(() => {
//     if (!active) return;
//     let cancelled = false;
//     const load = async () => {
//       const { data } = await supabase
//         .from("messages")
//         .select("id, body, sender_is_admin, created_at")
//         .eq("customer_id", active)
//         .order("created_at", { ascending: true });
//       if (!cancelled) setMessages((data ?? []) as Message[]);
//       try {
//         await markRead({ data: { customer_id: active } });
//       } catch {}
//       loadThreads();
//     };
//     load();
//     const channel = supabase
//       .channel(`admin-thread-${active}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `customer_id=eq.${active}`,
//         },
//         (payload) => setMessages((m) => [...m, payload.new as Message]),
//       )
//       .subscribe();
//     return () => {
//       cancelled = true;
//       supabase.removeChannel(channel);
//     };
//   }, [active]);

//   useEffect(() => {
//     scrollRef.current?.scrollTo({
//       top: scrollRef.current.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages]);

//   const send = async () => {
//     if (!active || !input.trim()) return;
//     const body = input.trim();
//     setInput("");
//     try {
//       await sendMsg({ data: { customer_id: active, body } });
//     } catch (e: any) {
//       toast.error(e.message);
//       setInput(body);
//     }
//   };

//   return (
//     <AdminLayout title="Messages">
//       <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
//         <aside className="overflow-y-auto rounded-lg border border-border bg-card">
//           {threads.length === 0 ? (
//             <p className="p-6 text-sm text-muted-foreground">No conversations yet.</p>
//           ) : (
//             <ul>
//               {threads.map((t) => (
//                 <li key={t.customer_id}>
//                   <button
//                     onClick={() => setActive(t.customer_id)}
//                     className={cn(
//                       "w-full border-b border-border px-4 py-3 text-left transition-smooth hover:bg-secondary/40",
//                       active === t.customer_id && "bg-secondary/60",
//                     )}
//                   >
//                     <div className="flex items-center justify-between gap-2">
//                       <p className="truncate text-sm font-medium">
//                         {t.full_name || t.email || t.customer_id.slice(0, 8)}
//                       </p>
//                       {t.unread > 0 && (
//                         <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
//                           {t.unread}
//                         </span>
//                       )}
//                     </div>
//                     <p className="mt-1 truncate text-xs text-muted-foreground">
//                       {t.last_body}
//                     </p>
//                     <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
//                       {new Date(t.last_at).toLocaleString()}
//                     </p>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </aside>

//         <section className="flex flex-col rounded-lg border border-border bg-card">
//           {!active ? (
//             <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
//               Select a conversation
//             </div>
//           ) : (
//             <>
//               <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
//                 <ul className="space-y-3">
//                   {messages.map((m) => (
//                     <li
//                       key={m.id}
//                       className={`flex ${m.sender_is_admin ? "justify-end" : "justify-start"}`}
//                     >
//                       <div
//                         className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
//                           m.sender_is_admin
//                             ? "bg-primary text-primary-foreground"
//                             : "bg-secondary text-foreground"
//                         }`}
//                       >
//                         <p className="whitespace-pre-wrap">{m.body}</p>
//                         <p
//                           className={`mt-1 text-[10px] ${m.sender_is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}
//                         >
//                           {new Date(m.created_at).toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </p>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//               <div className="flex gap-2 border-t border-border p-3">
//                 <Textarea
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   rows={2}
//                   className="resize-none"
//                   placeholder="Reply…"
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" && !e.shiftKey) {
//                       e.preventDefault();
//                       send();
//                     }
//                   }}
//                 />
//                 <Button onClick={send} disabled={!input.trim()}>
//                   <Send className="h-4 w-4" />
//                 </Button>
//               </div>
//             </>
//           )}
//         </section>
//       </div>
//     </AdminLayout>
//   );
// }



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

// ለሁለቱም አይነት መርጃዎች የምንጠቀምበት አንድ ወጥ Thread Type
type UnifiedThread = {
  id: string; // customer_id ወይም submission_id
  name: string;
  email?: string;
  last_body: string;
  last_at: string;
  unread: number;
  type: "chat" | "contact"; // መለያ ምልክት
};

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Messages — Admin" }] }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const [unifiedThreads, setUnifiedThreads] = useState<UnifiedThread[]>([]);
  const [activeThread, setActiveThread] = useState<UnifiedThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useServerFn(listAdminThreads);
  const sendMsg = useServerFn(adminSendMessage);
  const markRead = useServerFn(adminMarkThreadRead);

  // ሁለቱንም ከቀጥታ ቻት እና ከኮንታክት ፎርም የመጡትን መረጃዎች አቀናጅቶ የሚጭን ፈንክሽን
  const loadAllData = async () => {
    try {
      // 1. የቻት ትሬዶችን መጫን
      const chatRes = await fetchThreads();
      const chats: UnifiedThread[] = (chatRes.threads || []).map((t) => ({
        id: t.customer_id,
        name: t.full_name || t.email || "Unknown User",
        email: t.email,
        last_body: t.last_body,
        last_at: t.last_at,
        unread: t.unread,
        type: "chat",
      }));

      // 2. ከ contact_submissions መጫን
      const { data: submissions, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contacts: UnifiedThread[] = (submissions || []).map((s) => ({
        id: s.id, // ለኮንታክት IDውን እንጠቀማለን
        name: s.name,
        email: s.email,
        last_body: s.message,
        last_at: s.created_at,
        unread: 0, // የኮንታክት ፎርም Unread ካውንት ከሌለው 0 ይሁን
        type: "contact",
      }));

      // 3. ሁለቱን አቀናጅቶ በጊዜያቸው ሰርቶ (Sort) ማድረግ (የቅርብ ጊዜው ላይ እንዲመጣ)
      const combined = [...chats, ...contacts].sort(
        (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
      );

      setUnifiedThreads(combined);

      // አክቲቭ የሆነው ትሬድ ከተቀየረ ዳታውን አፕዴት ለማድረግ
      if (activeThread) {
        const updated = combined.find((t) => t.id === activeThread.id);
        if (updated) setActiveThread(updated);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Real-time ለውጦችን ለመከታተል (ለቻትም ለኮንታክትም)
  useEffect(() => {
    loadAllData();
    
    const chatChannel = supabase
      .channel("admin-messages-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadAllData())
      .subscribe();

    const contactChannel = supabase
      .channel("admin-contacts-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_submissions" }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(contactChannel);
    };
  }, []);

  // አንድ ሰው ሲመረጥ መልእክቶችን መጫኛ
  useEffect(() => {
    if (!activeThread) return;
    let cancelled = false;

    const loadMessages = async () => {
      if (activeThread.type === "chat") {
        // የቻት ከሆነ ከ messages ታብል መጫን
        const { data } = await supabase
          .from("messages")
          .select("id, body, sender_is_admin, created_at")
          .eq("customer_id", activeThread.id)
          .order("created_at", { ascending: true });

        if (!cancelled) setMessages((data ?? []) as Message[]);
        
        try {
          await markRead({ data: { customer_id: activeThread.id } });
        } catch {}
        loadAllData();
      } else {
        // ከኮንታክት የመጣ ከሆነ መጀመሪያ የላከውን መልእክት ብቻ እንደ አንድ ሜሴጅ እናሳየዋለን
        // በኋላ ሪፕላይ ስናደርግለት ወደ ቻት ይቀየራል ወይም እዚሁ ይጨምራል
        const initialMessage: Message = {
          id: activeThread.id,
          body: activeThread.last_body,
          sender_is_admin: false,
          created_at: activeThread.last_at,
        };
        
        // ከዚህ ቀደም ለዚህ ኢሜይል የተላኩ የሪፕላይ መልእክቶች ካሉ ከቻት ታብል ፈልጎ ማምጣት
        const { data: replies } = await supabase
          .from("messages")
          .select("id, body, sender_is_admin, created_at")
          .eq("customer_id", activeThread.id) // ወይም በኢሜይል ማገናኘት ትችላለህ
          .order("created_at", { ascending: true });

        if (!cancelled) {
          setMessages([initialMessage, ...(replies ?? []) as Message[]]);
        }
      }
    };

    loadMessages();

    // ለቻት ብቻ ሪልታይም ሊስነር ማስገባት
    const channel = supabase
      .channel(`admin-thread-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${activeThread.id}`,
        },
        (payload) => setMessages((m) => [...m, payload.new as Message])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeThread?.id]);

  // ስክሮል ማድረጊያ
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // መልስ መላኪያ (Reply)
  const send = async () => {
    if (!activeThread || !input.trim()) return;
    const body = input.trim();
    setInput("");
    try {
      // ለሁለቱም አይነት የ 'activeThread.id'ን በመጠቀም መላክ ይቻላል
      await sendMsg({ data: { customer_id: activeThread.id, body } });
      
      // ከኮንታክት የመጣ ከሆነ እና መጀመሪያ ከተላከ፣ ገጹን በፍጥነት ለማደስ፡
      if (activeThread.type === "contact") {
        setMessages((m) => [
          ...m,
          {
            id: Math.random().toString(),
            body,
            sender_is_admin: true,
            created_at: new String(new Date()),
          },
        ]);
      }
      loadAllData();
    } catch (e: any) {
      toast.error(e.message);1
      setInput(body);
    }
  };

  return (
    <AdminLayout title="Messages">
      <div className="grid h-[75vh] grid-cols-1 gap-4 md:grid-cols-[340px_1fr]">
        {/* የጎን ዝርዝር (Sidebar) */}
        <aside className="overflow-y-auto rounded-lg border border-border bg-card">
          {unifiedThreads.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul>
              {unifiedThreads.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveThread(t)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left transition-smooth hover:bg-secondary/40",
                      activeThread?.id === t.id && "bg-secondary/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {/* የኮንታክት ፎርም ከሆነ "C" የሚል ምልክት ማሳያ */}
                        {t.type === "contact" ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400" title="From Contact Form">
                            C
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-500/20 text-[11px] font-bold text-blue-600 dark:text-blue-400" title="Live Chat">
                            L
                          </span>
                        )}
                        <p className="truncate text-sm font-medium">{t.name}</p>
                      </div>
                      
                      {t.unread > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    
                    {t.email && (
                      <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                        {t.email}
                      </p>
                    )}
                    
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {t.last_body}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
                      {new Date(t.last_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* የመልእክት መለዋወጫው ክፍል (Chat Area) */}
        <section className="flex flex-col rounded-lg border border-border bg-card">
          {!activeThread ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation or contact submission
            </div>
          ) : (
            <>
              {/* የጭንቅላት መረጃ አሞሌ */}
              <div className="border-b border-border p-4 bg-secondary/20">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{activeThread.name}</h3>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider",
                    activeThread.type === "contact" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {activeThread.type === "contact" ? "Contact Submission" : "Live Chat"}
                  </span>
                </div>
                {activeThread.email && (
                  <a href={`mailto:${activeThread.email}`} className="text-xs text-blue-500 hover:underline">
                    {activeThread.email}
                  </a>
                )}
              </div>

              {/* የመልእክቶች ዝርዝር */}
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
                          className={`mt-1 text-[10px] ${
                            m.sender_is_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
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

              {/* መጻፊያ ሳጥን (Reply box) */}
              <div className="flex gap-2 border-t border-border p-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder={`Reply to ${activeThread.name}…`}
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
