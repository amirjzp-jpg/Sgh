import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { offerSchema } from "@/lib/validation";
import { isBlockedBetween } from "@/lib/blocks";

// Buyer makes an offer on a listing. Any earlier open offers in the same
// buyer/listing negotiation are superseded (marked countered).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing || listing.status !== "active") {
    return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "You can't make an offer on your own listing" }, { status: 400 });
  }
  if (await isBlockedBetween(user.id, listing.sellerId)) {
    return NextResponse.json({ error: "You can't interact with this user" }, { status: 403 });
  }

  const [, , offer] = await prisma.$transaction([
    prisma.offer.updateMany({
      where: { listingId: listing.id, buyerId: user.id, status: "pending" },
      data: { status: "countered" },
    }),
    prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId: listing.id, buyerId: user.id } },
      create: { listingId: listing.id, buyerId: user.id, sellerId: listing.sellerId },
      update: {},
    }),
    prisma.offer.create({
      data: { listingId: listing.id, buyerId: user.id, amountCents: parsed.data.amountCents },
    }),
  ]);

  return NextResponse.json({ id: offer.id }, { status: 201 });
}
