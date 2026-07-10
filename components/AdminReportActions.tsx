"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReportActions({
  reportId,
  listingId,
}: {
  reportId: string;
  listingId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function resolve() {
    setBusy(true);
    await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  async function removeListing() {
    if (!listingId) return;
    setBusy(true);
    await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "removed" }),
    });
    await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {listingId && (
        <button onClick={removeListing} disabled={busy} className="btn-danger !py-1.5">
          Remove listing
        </button>
      )}
      <button onClick={resolve} disabled={busy} className="btn-secondary !py-1.5">
        Mark resolved
      </button>
    </div>
  );
}
