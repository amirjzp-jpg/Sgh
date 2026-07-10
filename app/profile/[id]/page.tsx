import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import Stars from "@/components/Stars";
import ListingCard from "@/components/ListingCard";
import ReportButton from "@/components/ReportButton";
import BlockButton from "@/components/BlockButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const viewer = await currentUser();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      listings: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: { fromUser: { select: { id: true, name: true } } },
      },
    },
  });
  if (!user) notFound();

  const isSelf = viewer?.id === user.id;
  const blocked = viewer && !isSelf
    ? !!(await prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: viewer.id, blockedId: user.id } },
      }))
    : false;

  const pastOrders = isSelf
    ? await prisma.order.findMany({
        where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { listing: { select: { title: true } } },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 font-serif text-3xl font-bold text-brand-800">
          {user.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-bold text-stone-800">{user.name}</h1>
          <p className="text-sm text-stone-500">
            {user.city} · member since {formatDate(user.createdAt)}
          </p>
          <Stars rating={user.rating} count={user.reviewsReceived.length} />
        </div>
        {viewer && !isSelf && (
          <div className="flex flex-col items-end gap-2">
            <ReportButton targetUserId={user.id} label="Report user" />
            <BlockButton blockedId={user.id} name={user.name.split(" ")[0]} initiallyBlocked={blocked} />
          </div>
        )}
      </div>

      <section>
        <h2 className="font-serif text-xl font-bold text-stone-800">
          Active listings ({user.listings.length})
        </h2>
        {user.listings.length === 0 ? (
          <p className="card mt-3 p-6 text-center text-sm text-stone-500">
            Nothing for sale right now.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {user.listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {isSelf && pastOrders.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-800">Recent orders</h2>
            <Link href="/orders" className="text-sm font-semibold text-brand-700 hover:underline">
              All orders →
            </Link>
          </div>
          <ul className="card mt-3 divide-y divide-stone-100">
            {pastOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 p-3 text-sm transition hover:bg-stone-50">
                  <span className="truncate">
                    {o.buyerId === user.id ? "Bought" : "Sold"}: {o.listing.title}
                  </span>
                  <span className="whitespace-nowrap text-xs text-stone-500">
                    {formatMoney(o.amountCents)} · {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-serif text-xl font-bold text-stone-800">
          Reviews ({user.reviewsReceived.length})
        </h2>
        {user.reviewsReceived.length === 0 ? (
          <p className="card mt-3 p-6 text-center text-sm text-stone-500">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {user.reviewsReceived.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${r.fromUser.id}`} className="text-sm font-semibold text-stone-800 hover:underline">
                    {r.fromUser.name}
                  </Link>
                  <span className="text-amber-500">
                    {"★".repeat(r.rating)}
                    <span className="text-stone-300">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{r.comment}</p>
                <p className="mt-1 text-xs text-stone-400">{formatDate(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
