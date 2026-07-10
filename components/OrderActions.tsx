"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Buyer-side confirm + both-sides review form for the order page.
export default function OrderActions({
  orderId,
  status,
  isBuyer,
  alreadyReviewed,
  otherName,
}: {
  orderId: string;
  status: string;
  isBuyer: boolean;
  alreadyReviewed: boolean;
  otherName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmReceipt() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't confirm");
      return;
    }
    router.refresh();
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't post the review");
      return;
    }
    router.refresh();
  }

  if (status === "delivered" && isBuyer) {
    return (
      <div className="card border-amber-300 bg-amber-50 p-5">
        <h2 className="font-semibold text-stone-800">Did everything arrive as described?</h2>
        <p className="mt-1 text-sm text-stone-600">
          Confirming releases the escrowed payment to the seller.
        </p>
        <button onClick={confirmReceipt} disabled={busy} className="btn-primary mt-3">
          {busy ? "Confirming…" : "Confirm receipt & release funds"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (status === "confirmed" && !alreadyReviewed) {
    return (
      <div className="card p-5">
        <h2 className="font-semibold text-stone-800">Rate your experience with {otherName}</h2>
        <form onSubmit={submitReview} className="mt-3 space-y-3">
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={n <= rating ? "text-amber-500" : "text-stone-300"}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            required
            rows={3}
            maxLength={1000}
            className="input"
            placeholder="How did it go?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Posting…" : "Post review"}
          </button>
        </form>
      </div>
    );
  }

  if (status === "confirmed" && alreadyReviewed) {
    return (
      <div className="card p-4 text-sm text-stone-500">
        ✅ Order complete — thanks for leaving a review.
      </div>
    );
  }

  if (isBuyer) {
    return (
      <div className="card p-4 text-sm text-stone-500">
        You&apos;ll be able to confirm receipt once the courier marks this delivered.
      </div>
    );
  }
  return (
    <div className="card p-4 text-sm text-stone-500">
      {status === "delivered"
        ? "Waiting for the buyer to confirm receipt — funds release to your wallet then."
        : "Funds are held in escrow and release to your wallet when the buyer confirms delivery."}
    </div>
  );
}
