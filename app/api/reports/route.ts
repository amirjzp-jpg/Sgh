import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { reportSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!rateLimit(`report:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many reports — slow down" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { targetUserId, listingId, reason } = parsed.data;

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "You can't report yourself" }, { status: 400 });
  }
  if (targetUserId) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.report.create({
    data: { reporterId: user.id, targetUserId, listingId, reason },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
