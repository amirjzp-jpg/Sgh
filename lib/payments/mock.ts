// ─── Mock payment module ────────────────────────────────────────────────────
// This is the single seam for real payments. A Stripe Connect integration
// replaces the body of `processPayment` (create a PaymentIntent with a
// transfer_group / destination charge) and nothing else in the app changes:
// callers only see { ok, paymentRef }.
//
// Card data passes through validation and is discarded — it is never written
// to the database or logged, matching the posture a real integration needs
// (Stripe holds card data, we hold a reference).

export type PaymentRequest = {
  amountCents: number;
  currency?: "CAD";
};

export type PaymentResult =
  | { ok: true; paymentRef: string }
  | { ok: false; error: string };

export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  if (request.amountCents <= 0) {
    return { ok: false, error: "Invalid amount" };
  }
  // Simulate processor latency so the checkout UI feels real.
  await new Promise((resolve) => setTimeout(resolve, 600));
  const paymentRef = `mockpay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return { ok: true, paymentRef };
}
