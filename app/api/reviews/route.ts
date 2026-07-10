import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { orderId, rating, comment } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.buyerId !== user.id && order.sellerId !== user.id) {
    return NextResponse.json({ error: "You weren't part of this order" }, { status: 403 });
  }
  if (order.status !== "confirmed") {
    return NextResponse.json({ error: "Reviews open once the order is confirmed" }, { status: 400 });
  }

  const toUserId = order.buyerId === user.id ? order.sellerId : order.buyerId;

  const existing = await prisma.review.findUnique({
    where: { orderId_fromUserId: { orderId, fromUserId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this order" }, { status: 409 });
  }

  await prisma.review.create({
    data: { orderId, fromUserId: user.id, toUserId, rating, comment },
  });

  const agg = await prisma.review.aggregate({
    where: { toUserId },
    _avg: { rating: true },
  });
  await prisma.user.update({
    where: { id: toUserId },
    data: { rating: agg._avg.rating ?? null },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
