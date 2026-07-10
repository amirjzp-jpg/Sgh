import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

// Buyer confirms receipt: order -> confirmed, escrowed seller credit -> released.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.buyerId !== user.id) {
    return NextResponse.json({ error: "Only the buyer can confirm receipt" }, { status: 403 });
  }
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Order must be delivered before confirming" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "confirmed" } }),
    prisma.walletTxn.updateMany({
      where: { orderId: order.id, userId: order.sellerId, type: "credit", status: "held" },
      data: { status: "released" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
