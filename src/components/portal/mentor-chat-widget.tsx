"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CoachMode } from "@/lib/mentor";

const MODES: { value: CoachMode; label: string }[] = [
  { value: "explain", label: "Explain" },
  { value: "hint", label: "Hint" },
  { value: "socratic", label: "Socratic" },
  { value: "debug", label: "Debug" },
  { value: "review", label: "Review" },
  { value: "challenge", label: "Challenge" },
  { value: "interview", label: "Interview" },
  { value: "career", label: "Career" },
  { value: "next_step", label: "Next step" },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function MentorChatWidget({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [mode, setMode] = useState<CoachMode>("explain");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    setLoadingHistory(true);
    fetch(`/api/mentor?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: message }]);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, courseId, mode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { id: `reply-${Date.now()}`, role: "assistant", content: data.reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reach your mentor. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function requestHumanHelp() {
    const summary =
      messages
        .slice(-4)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n") || "Requesting help — no chat context yet.";
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: summary }),
      });
      if (!res.ok) throw new Error();
      toast.success("A mentor has been notified — we'll follow up by email.");
    } catch {
      toast.error("Couldn't send your request. Try again shortly.");
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lifted">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="size-4 text-accent" />
              AI Coach
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  mode === m.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loadingHistory && <p className="text-center text-xs text-muted-foreground">Loading…</p>}
            {!loadingHistory && messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Ask about this module in whichever mode fits — I have context on the course content.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask your mentor…"
                className="min-h-10 flex-1 resize-none py-2"
                rows={1}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending} aria-label="Send">
                <Send className="size-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={requestHumanHelp} className="w-fit text-muted-foreground">
              <LifeBuoy className="size-3.5" />
              Request human help
            </Button>
          </div>
        </div>
      )}

      <Button
        size="icon-sm"
        variant="accent"
        className="size-14 rounded-full shadow-glow"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle AI Coach chat"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
