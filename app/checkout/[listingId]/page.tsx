import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, parseImages } from "@/lib/format";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { listingId: string };
  searchParams: { offer?: string };
}) {
  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=/checkout/${params.listingId}`);

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { seller: { select: { name: true, city: true } } },
  });
  if (!listing || listing.status !== "active" || listing.sellerId === user.id) notFound();

  let amountCents = listing.priceCents;
  let offerId: string | undefined;
  if (searchParams.offer) {
    const offer = await prisma.offer.findUnique({ where: { id: searchParams.offer } });
    if (
      offer &&
      offer.listingId === listing.id &&
      offer.buyerId === user.id &&
      offer.status === "accepted"
    ) {
      amountCents = offer.amountCents;
      offerId = offer.id;
    }
  }

  const image = parseImages(listing.images)[0];

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-800">Checkout</h1>
        <p className="mt-1 text-sm text-stone-500">
          Demo payment — no real card is charged. Your payment is held in escrow until you confirm
          delivery.
        </p>
        <CheckoutForm listingId={listing.id} offerId={offerId} amountCents={amountCents} />
      </div>

      <aside className="card h-fit p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={listing.title} className="aspect-[4/3] w-full rounded-lg object-cover" />
        <h2 className="mt-3 text-sm font-semibold text-stone-800">{listing.title}</h2>
        <p className="text-xs text-stone-500">
          Sold by {listing.seller.name} · {listing.seller.city}
        </p>
        <dl className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Item</dt>
            <dd>{formatMoney(amountCents)}</dd>
          </div>
          {offerId && (
            <div className="flex justify-between text-xs text-stone-400">
              <dt>Accepted offer (was {formatMoney(listing.priceCents)})</dt>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-stone-500">Courier handoff</dt>
            <dd className="text-brand-700">Free</dd>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-2 font-bold">
            <dt>Total</dt>
            <dd>{formatMoney(amountCents)}</dd>
          </div>
        </dl>
        <p className="mt-3 rounded-lg bg-brand-50 p-2 text-xs text-brand-800">
          🛡️ Held in escrow — the seller is paid only after you confirm receipt.
        </p>
      </aside>
    </div>
  );
}
