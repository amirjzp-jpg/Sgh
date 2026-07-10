"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURIER_TRANSITIONS, ORDER_STATUS_LABELS } from "@/lib/constants";

export default function CourierAdvanceButton({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const next = COURIER_TRANSITIONS[status];
  if (!next) return null;

  async function advance() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update");
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button onClick={advance} disabled={busy} className="btn-primary !py-1.5">
        {busy ? "Updating…" : `Mark ${ORDER_STATUS_LABELS[next].toLowerCase()}`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
