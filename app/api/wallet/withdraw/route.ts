import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { withdrawSchema } from "@/lib/validation";
import { walletBalanceCents } from "@/lib/wallet";

// Mock withdrawal: records a pending withdrawal txn. A real e-transfer /
// payout rail would consume these pending records.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const balance = await walletBalanceCents(user.id);
  if (parsed.data.amountCents > balance) {
    return NextResponse.json({ error: "Amount exceeds your available balance" }, { status: 400 });
  }

  await prisma.walletTxn.create({
    data: {
      userId: user.id,
      type: "withdrawal",
      amountCents: parsed.data.amountCents,
      status: "pending",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
