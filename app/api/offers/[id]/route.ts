import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { offerActionSchema } from "@/lib/validation";

// Respond to a pending offer.
// - An offer with fromSeller=false awaits the SELLER (accept/decline/counter).
// - An offer with fromSeller=true is a seller counter awaiting the BUYER.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = offerActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { action, counterAmountCents } = parsed.data;

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: { listing: true },
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.status !== "pending") {
    return NextResponse.json({ error: "This offer has already been resolved" }, { status: 400 });
  }
  if (offer.listing.status !== "active") {
    return NextResponse.json({ error: "Listing is no longer available" }, { status: 400 });
  }

  const responderId = offer.fromSeller ? offer.buyerId : offer.listing.sellerId;
  if (user.id !== responderId) {
    return NextResponse.json({ error: "This offer isn't waiting on you" }, { status: 403 });
  }

  if (action === "accept" || action === "decline") {
    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: action === "accept" ? "accepted" : "declined" },
    });
    return NextResponse.json({ ok: true });
  }

  // counter: close this offer, open a new pending one from the responder's side
  if (!counterAmountCents) {
    return NextResponse.json({ error: "Counter offers need an amount" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: "countered" } }),
    prisma.offer.create({
      data: {
        listingId: offer.listingId,
        buyerId: offer.buyerId,
        amountCents: counterAmountCents,
        fromSeller: !offer.fromSeller,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
