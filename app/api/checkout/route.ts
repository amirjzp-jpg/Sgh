import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { checkoutSchema } from "@/lib/validation";
import { processPayment } from "@/lib/payments/mock";
import { assignCourier } from "@/lib/courier";

// Mock checkout: validates the card shape (never stores it), simulates a
// payment, then in one transaction creates the escrowed order, assigns a
// courier from the seeded pool, marks the listing sold, and records wallet
// transactions (buyer debit, seller credit held in escrow).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { listingId, offerId } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "Listing is no longer available" }, { status: 409 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 });
  }

  let amountCents = listing.priceCents;
  if (offerId) {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (
      !offer ||
      offer.listingId !== listing.id ||
      offer.buyerId !== user.id ||
      offer.status !== "accepted"
    ) {
      return NextResponse.json({ error: "That offer isn't valid for this purchase" }, { status: 400 });
    }
    amountCents = offer.amountCents;
  }

  const payment = await processPayment({ amountCents });
  if (!payment.ok) {
    return NextResponse.json({ error: payment.error }, { status: 402 });
  }

  const order = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction so two buyers can't both purchase.
    const stillActive = await tx.listing.updateMany({
      where: { id: listing.id, status: "active" },
      data: { status: "sold" },
    });
    if (stillActive.count === 0) {
      throw new Error("SOLD");
    }

    const courier = await assignCourier(tx);

    const order = await tx.order.create({
      data: {
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.sellerId,
        amountCents,
        status: "courier_assigned",
        paymentRef: payment.paymentRef,
        courierId: courier.id,
      },
    });

    await tx.deliveryEvent.create({
      data: { orderId: order.id, courierId: courier.id, status: "courier_assigned" },
    });

    await tx.offer.updateMany({
      where: { listingId: listing.id, status: "pending" },
      data: { status: "declined" },
    });

    await tx.walletTxn.create({
      data: {
        userId: user.id,
        type: "debit",
        amountCents,
        orderId: order.id,
        status: "completed",
      },
    });
    await tx.walletTxn.create({
      data: {
        userId: listing.sellerId,
        type: "credit",
        amountCents,
        orderId: order.id,
        status: "held",
      },
    });

    return order;
  }).catch((e) => {
    if (e instanceof Error && e.message === "SOLD") return null;
    throw e;
  });

  if (!order) {
    return NextResponse.json({ error: "Someone else just bought this listing" }, { status: 409 });
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
