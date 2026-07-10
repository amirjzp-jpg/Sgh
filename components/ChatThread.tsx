"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
};

const POLL_MS = 2500;

export default function ChatThread({
  conversationId,
  selfId,
}: {
  conversationId: string;
  selfId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    const after = lastSeenRef.current;
    const url = `/api/conversations/${conversationId}/messages${
      after ? `?after=${encodeURIComponent(after)}` : ""
    }`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const data: { messages: Msg[] } = await res.json();
    if (data.messages.length > 0) {
      lastSeenRef.current = data.messages[data.messages.length - 1].createdAt;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...prev, ...data.messages.filter((m) => !known.has(m.id))];
      });
    }
    setLoaded(true);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    setError("");
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Message didn't send");
      setDraft(content);
      return;
    }
    await fetchMessages();
  }

  return (
    <>
      <div className="card mt-3 flex-1 space-y-2 overflow-y-auto p-4">
        {!loaded ? (
          <p className="text-center text-sm text-stone-400">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-stone-400">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === selfId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-700 text-white"
                      : "rounded-bl-sm bg-stone-100 text-stone-800"
                  }`}
                >
                  <p className="whitespace-pre-line break-words">{m.content}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? "text-brand-100/70" : "text-stone-400"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("en-CA", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="input"
        />
        <button type="submit" className="btn-primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </>
  );
}
