import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, parseImages } from "@/lib/format";
import ChatThread from "@/components/ChatThread";
import OfferPanel from "@/components/OfferPanel";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/inbox");

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });
  if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) {
    notFound();
  }

  const isBuyer = conversation.buyerId === user.id;
  const other = isBuyer ? conversation.seller : conversation.buyer;
  const image = parseImages(conversation.listing.images)[0];

  const offers = await prisma.offer.findMany({
    where: { listingId: conversation.listingId, buyerId: conversation.buyerId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-160px)] max-w-2xl flex-col">
      <Link
        href={`/listings/${conversation.listing.id}`}
        className="card flex items-center gap-3 p-3 transition hover:bg-stone-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">
            {conversation.listing.title}
          </p>
          <p className="text-xs text-stone-500">
            {formatMoney(conversation.listing.priceCents)} · chatting with {other.name}
          </p>
        </div>
        {conversation.listing.status === "sold" && (
          <span className="badge bg-stone-800 text-white">Sold</span>
        )}
      </Link>

      <OfferPanel
        listingId={conversation.listingId}
        listingStatus={conversation.listing.status}
        listingPriceCents={conversation.listing.priceCents}
        isBuyer={isBuyer}
        offers={offers.map((o) => ({
          id: o.id,
          amountCents: o.amountCents,
          status: o.status,
          fromSeller: o.fromSeller,
        }))}
      />

      <ChatThread conversationId={conversation.id} selfId={user.id} />
    </div>
  );
}
