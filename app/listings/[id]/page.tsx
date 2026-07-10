import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatMoney, formatDate, parseImages } from "@/lib/format";
import Stars from "@/components/Stars";
import ListingActions from "@/components/ListingActions";
import ImageGallery from "@/components/ImageGallery";
import ReportButton from "@/components/ReportButton";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          city: true,
          rating: true,
          createdAt: true,
          _count: { select: { reviewsReceived: true } },
        },
      },
    },
  });
  if (!listing || listing.status === "removed") notFound();

  const images = parseImages(listing.images);
  const isOwner = user?.id === listing.seller.id;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <ImageGallery images={images} alt={listing.title} />
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Description
          </h2>
          <p className="mt-2 whitespace-pre-line text-stone-700">{listing.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-2xl font-bold text-stone-800">{listing.title}</h1>
            {listing.status === "sold" && <span className="badge bg-stone-800 text-white">Sold</span>}
          </div>
          <p className="mt-2 text-3xl font-bold text-brand-700">{formatMoney(listing.priceCents)}</p>
          <p className="mt-1 text-sm text-stone-500">
            {listing.condition} · {listing.category} · Listed {formatDate(listing.createdAt)}
          </p>

          {listing.status === "active" && !isOwner && (
            <ListingActions
              listingId={listing.id}
              priceCents={listing.priceCents}
              signedIn={!!user}
            />
          )}
          {isOwner && (
            <p className="mt-4 rounded-lg bg-stone-100 p-3 text-sm text-stone-600">
              This is your listing. Buyers will reach you in your{" "}
              <Link className="font-semibold text-brand-700 hover:underline" href="/inbox">
                inbox
              </Link>
              .
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
            <span>🛡️ Buyer protected</span>
            <span>·</span>
            <span>🚲 Courier handoff</span>
            <span>·</span>
            <span>💰 Escrow held</span>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Seller</h2>
          <Link
            href={`/profile/${listing.seller.id}`}
            className="mt-2 flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-serif text-lg font-bold text-brand-800">
              {listing.seller.name[0]}
            </div>
            <div>
              <p className="font-semibold text-stone-800">{listing.seller.name}</p>
              <p className="text-xs text-stone-500">{listing.seller.city}</p>
              <Stars rating={listing.seller.rating} count={listing.seller._count.reviewsReceived} />
            </div>
          </Link>
          {user && !isOwner && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <ReportButton listingId={listing.id} label="Report this listing" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
