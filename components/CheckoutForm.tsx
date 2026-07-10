"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";

// Card-style UI for the mock payment. Values are validated for shape, sent
// once, and never stored — see lib/payments/mock.ts for the swap-in seam.
export default function CheckoutForm({
  listingId,
  offerId,
  amountCents,
}: {
  listingId: string;
  offerId?: string;
  amountCents: number;
}) {
  const router = useRouter();
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function formatCardNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 16);
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (card.number.length !== 16) return setError("Card number must be 16 digits");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return setError("Expiry must be MM/YY");
    if (!/^\d{3,4}$/.test(card.cvc)) return setError("CVC must be 3–4 digits");
    if (card.name.trim().length < 2) return setError("Enter the name on the card");

    setBusy(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        offerId,
        cardNumber: card.number,
        cardExpiry: card.expiry,
        cardCvc: card.cvc,
        cardName: card.name,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Payment failed");
      return;
    }
    router.push(`/orders/${data.orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-5 space-y-4 p-6">
      <div className="rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-brand-100/70">Lolosel demo pay</p>
        <p className="mt-4 font-mono text-lg tracking-widest">
          {(card.number.padEnd(16, "•").match(/.{1,4}/g) ?? []).join(" ")}
        </p>
        <div className="mt-3 flex justify-between text-xs text-brand-100/90">
          <span>{card.name || "NAME ON CARD"}</span>
          <span>{card.expiry || "MM/YY"}</span>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="cardName">Name on card</label>
        <input id="cardName" className="input" value={card.name} autoComplete="off"
          onChange={(e) => setCard({ ...card, name: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="cardNumber">Card number</label>
        <input id="cardNumber" className="input font-mono" inputMode="numeric" autoComplete="off"
          placeholder="4242 4242 4242 4242" value={card.number}
          onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="expiry">Expiry</label>
          <input id="expiry" className="input font-mono" inputMode="numeric" placeholder="12/28"
            autoComplete="off" value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
        </div>
        <div>
          <label className="label" htmlFor="cvc">CVC</label>
          <input id="cvc" className="input font-mono" inputMode="numeric" placeholder="123"
            autoComplete="off" maxLength={4} value={card.cvc}
            onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Processing…" : `Pay ${formatMoney(amountCents)} into escrow`}
      </button>
      <p className="text-center text-xs text-stone-400">
        Simulated processor — any 16-digit number works. Card details are never stored.
      </p>
    </form>
  );
}
