import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { blockSchema } from "@/lib/validation";

// Toggle a block on another user.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { blockedId } = parsed.data;
  if (blockedId === user.id) {
    return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
  });
  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }
  await prisma.block.create({ data: { blockerId: user.id, blockedId } });
  return NextResponse.json({ blocked: true });
}
