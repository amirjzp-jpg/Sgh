import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, formatDate, parseImages } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  confirmed: "bg-brand-100 text-brand-800",
  delivered: "bg-amber-100 text-amber-800",
  refunded: "bg-stone-200 text-stone-600",
  disputed: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/orders");

  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true, images: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-stone-800">Orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-stone-500">
          No orders yet.{" "}
          <Link href="/browse" className="font-semibold text-brand-700 hover:underline">
            Browse listings →
          </Link>
        </div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {orders.map((o) => {
            const image = parseImages(o.listing.images)[0];
            const role = o.buyerId === user.id ? "Buying" : "Selling";
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center gap-3 p-3 transition hover:bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{o.listing.title}</p>
                    <p className="text-xs text-stone-500">
                      {role} · {formatMoney(o.amountCents)} ·{" "}
                      {role === "Buying" ? `from ${o.seller.name}` : `to ${o.buyer.name}`} ·{" "}
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <span className={`badge ${statusColors[o.status] ?? "bg-stone-100 text-stone-600"}`}>
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
