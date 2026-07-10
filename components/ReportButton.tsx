"use client";

import { useState } from "react";

export default function ReportButton({
  targetUserId,
  listingId,
  label = "Report",
}: {
  targetUserId?: string;
  listingId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, listingId, reason }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return <p className="text-sm text-brand-700">Thanks — our team will take a look.</p>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-stone-500 hover:text-red-600"
      >
        🚩 {label}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <textarea
            required
            minLength={3}
            rows={2}
            className="input"
            placeholder="What's wrong?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button type="submit" className="btn-danger" disabled={state === "busy"}>
            {state === "busy" ? "Sending…" : "Submit report"}
          </button>
          {state === "error" && <p className="text-sm text-red-600">Couldn&apos;t send the report.</p>}
        </form>
      )}
    </div>
  );
}
