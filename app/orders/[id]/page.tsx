import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, formatDateTime, parseImages } from "@/lib/format";
import { ORDER_TIMELINE, ORDER_STATUS_LABELS } from "@/lib/constants";
import OrderActions from "@/components/OrderActions";
import ReportButton from "@/components/ReportButton";
import BlockButton from "@/components/BlockButton";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/orders");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, images: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      courier: true,
      deliveryEvents: { orderBy: { timestamp: "asc" } },
      reviews: true,
    },
  });
  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id)) notFound();

  const isBuyer = order.buyerId === user.id;
  const other = isBuyer ? order.seller : order.buyer;
  const image = parseImages(order.listing.images)[0];

  const reachedIndex = ORDER_TIMELINE.indexOf(order.status as (typeof ORDER_TIMELINE)[number]);
  const eventByStatus = new Map(order.deliveryEvents.map((e) => [e.status, e]));
  const myReview = order.reviews.find((r) => r.fromUserId === user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card flex items-center gap-4 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-16 w-16 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <Link href={`/listings/${order.listing.id}`} className="font-semibold text-stone-800 hover:underline">
            {order.listing.title}
          </Link>
          <p className="text-sm text-stone-500">
            {formatMoney(order.amountCents)} · {isBuyer ? "bought from" : "sold to"}{" "}
            <Link href={`/profile/${other.id}`} className="font-medium text-brand-700 hover:underline">
              {other.name}
            </Link>
          </p>
          {order.courier && (
            <p className="text-xs text-stone-400">Courier: {order.courier.name}</p>
          )}
        </div>
        <span className="badge bg-brand-100 text-brand-800">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Delivery timeline
        </h2>
        <ol className="mt-4 space-y-0">
          {ORDER_TIMELINE.map((status, i) => {
            const reached = reachedIndex >= i || (status === "paid_escrow" && reachedIndex >= 0);
            const event = eventByStatus.get(status);
            const timestamp =
              status === "paid_escrow"
                ? order.createdAt
                : status === "confirmed"
                  ? undefined
                  : event?.timestamp;
            return (
              <li key={status} className="relative flex gap-3 pb-6 last:pb-0">
                {i < ORDER_TIMELINE.length - 1 && (
                  <span
                    className={`absolute left-[9px] top-5 h-full w-0.5 ${
                      reachedIndex > i ? "bg-brand-600" : "bg-stone-200"
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    reached ? "bg-brand-600 text-white" : "border-2 border-stone-300 bg-white"
                  }`}
                >
                  {reached ? "✓" : ""}
                </span>
                <div>
                  <p className={`text-sm font-medium ${reached ? "text-stone-800" : "text-stone-400"}`}>
                    {ORDER_STATUS_LABELS[status]}
                  </p>
                  {reached && timestamp && (
                    <p className="text-xs text-stone-400">{formatDateTime(timestamp)}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {["refunded", "disputed"].includes(order.status) && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            This order is {order.status}.
          </p>
        )}
      </div>

      <OrderActions
        orderId={order.id}
        status={order.status}
        isBuyer={isBuyer}
        alreadyReviewed={!!myReview}
        otherName={other.name}
      />

      <div className="card flex items-center justify-between p-4 text-sm">
        <span className="text-stone-500">Problem with {other.name}?</span>
        <div className="flex items-center gap-4">
          <ReportButton targetUserId={other.id} label={`Report ${other.name.split(" ")[0]}`} />
          <BlockButton blockedId={other.id} name={other.name.split(" ")[0]} />
        </div>
      </div>
    </div>
  );
}
