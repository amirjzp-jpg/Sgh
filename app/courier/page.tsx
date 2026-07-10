import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, parseImages } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import CourierAdvanceButton from "@/components/CourierAdvanceButton";

export const dynamic = "force-dynamic";

// Demo courier console. Couriers are a seeded fake pool rather than real
// accounts, so any signed-in user can drive deliveries forward here — this
// screen stands in for the real dispatch/driver app.
export default async function CourierPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/courier");

  const active = await prisma.order.findMany({
    where: { status: { in: ["courier_assigned", "picked_up", "in_transit"] } },
    orderBy: { createdAt: "asc" },
    include: {
      listing: { select: { title: true, images: true } },
      buyer: { select: { name: true, city: true } },
      seller: { select: { name: true, city: true } },
      courier: true,
    },
  });

  const recent = await prisma.order.findMany({
    where: { status: { in: ["delivered", "confirmed"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { listing: { select: { title: true } }, courier: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-800">Courier dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">
          Demo console — in production this is the driver app. Advance any delivery to simulate the
          courier&apos;s day.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Active deliveries ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="card mt-2 p-8 text-center text-sm text-stone-500">
            Nothing on the road. Buy something to create a delivery!
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {active.map((o) => {
              const image = parseImages(o.listing.images)[0];
              return (
                <li key={o.id} className="card flex flex-wrap items-center gap-4 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {o.listing.title} · {formatMoney(o.amountCents)}
                    </p>
                    <p className="text-xs text-stone-500">
                      Pickup: {o.seller.name} ({o.seller.city}) → Dropoff: {o.buyer.name} (
                      {o.buyer.city})
                    </p>
                    <p className="text-xs text-stone-400">
                      {o.courier?.name} · currently: {ORDER_STATUS_LABELS[o.status]}
                    </p>
                  </div>
                  <CourierAdvanceButton orderId={o.id} status={o.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Recently delivered
          </h2>
          <ul className="card mt-2 divide-y divide-stone-100">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-3 text-sm">
                <span className="truncate text-stone-700">{o.listing.title}</span>
                <span className="badge bg-brand-100 text-brand-800">
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
