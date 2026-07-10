import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { advanceSchema } from "@/lib/validation";
import { COURIER_TRANSITIONS } from "@/lib/constants";

// Courier console: advance an order along picked_up -> in_transit -> delivered.
// Couriers are a seeded fake pool (not accounts), so in this demo any signed-in
// user can drive the console — the transition rules are still enforced.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = advanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.courierId) {
    return NextResponse.json({ error: "No courier assigned" }, { status: 400 });
  }

  const expectedNext = COURIER_TRANSITIONS[order.status];
  if (parsed.data.status !== expectedNext) {
    return NextResponse.json(
      { error: `Order is "${order.status}" — next step is "${expectedNext ?? "none"}"` },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: parsed.data.status } }),
    prisma.deliveryEvent.create({
      data: { orderId: order.id, courierId: order.courierId, status: parsed.data.status },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
