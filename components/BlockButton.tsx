"use client";

import { useState } from "react";

export default function BlockButton({
  blockedId,
  name,
  initiallyBlocked = false,
}: {
  blockedId: string;
  name: string;
  initiallyBlocked?: boolean;
}) {
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setBlocked(data.blocked);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-sm font-medium ${
        blocked ? "text-red-600 hover:text-stone-500" : "text-stone-500 hover:text-red-600"
      }`}
    >
      {blocked ? `🚫 Unblock ${name}` : `🚫 Block ${name}`}
    </button>
  );
}
