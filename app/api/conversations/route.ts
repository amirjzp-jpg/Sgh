import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { isBlockedBetween } from "@/lib/blocks";

const schema = z.object({ listingId: z.string().min(1) });

// Find-or-create the conversation between the current user (buyer) and a listing's seller.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing || listing.status === "removed") {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "That's your own listing" }, { status: 400 });
  }
  if (await isBlockedBetween(user.id, listing.sellerId)) {
    return NextResponse.json({ error: "You can't message this user" }, { status: 403 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId: listing.id, buyerId: user.id } },
    create: { listingId: listing.id, buyerId: user.id, sellerId: listing.sellerId },
    update: {},
  });

  return NextResponse.json({ id: conversation.id });
}
