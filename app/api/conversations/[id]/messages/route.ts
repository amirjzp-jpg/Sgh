import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { messageSchema } from "@/lib/validation";
import { isBlockedBetween } from "@/lib/blocks";

async function getParticipantConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return null;
  return conversation;
}

// Poll endpoint: returns messages (optionally only those after ?after=<ISO date>)
// and marks the thread read for the requesting side.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const conversation = await getParticipantConversation(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const afterParam = new URL(req.url).searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : null;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      ...(after && !isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  const readField = conversation.buyerId === user.id ? "buyerLastReadAt" : "sellerLastReadAt";
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { [readField]: new Date() },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const conversation = await getParticipantConversation(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const otherId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;
  if (await isBlockedBetween(user.id, otherId)) {
    return NextResponse.json({ error: "You can't message this user" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: user.id, content: parsed.data.content },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
