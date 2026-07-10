import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatDateTime, parseImages, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/inbox");

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: { select: { title: true, priceCents: true, images: true, status: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const isBuyer = c.buyerId === user.id;
      const lastRead = isBuyer ? c.buyerLastReadAt : c.sellerLastReadAt;
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });
      return { ...c, unread, other: isBuyer ? c.seller : c.buyer };
    }),
  );

  withUnread.sort((a, b) => {
    const ta = a.messages[0]?.createdAt ?? a.createdAt;
    const tb = b.messages[0]?.createdAt ?? b.createdAt;
    return tb.getTime() - ta.getTime();
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-stone-800">Inbox</h1>
      {withUnread.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-stone-500">
          No conversations yet.{" "}
          <Link href="/browse" className="font-semibold text-brand-700 hover:underline">
            Find something you love →
          </Link>
        </div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {withUnread.map((c) => {
            const image = parseImages(c.listing.images)[0];
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link href={`/inbox/${c.id}`} className="flex items-center gap-3 p-3 transition hover:bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${c.unread > 0 ? "font-bold text-stone-900" : "font-medium text-stone-700"}`}>
                        {c.other.name} · {c.listing.title}
                      </p>
                      {last && (
                        <span className="whitespace-nowrap text-xs text-stone-400">
                          {formatDateTime(last.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-stone-800" : "text-stone-500"}`}>
                      {last?.content ?? "No messages yet"}
                    </p>
                    <p className="text-xs text-stone-400">{formatMoney(c.listing.priceCents)}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
