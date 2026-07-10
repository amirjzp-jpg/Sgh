import Link from "next/link";
import { formatMoney, parseImages } from "@/lib/format";

type ListingCardProps = {
  listing: {
    id: string;
    title: string;
    priceCents: number;
    category: string;
    condition: string;
    images: string;
    status: string;
    seller?: { name: string; city: string };
  };
};

export default function ListingCard({ listing }: { listing: ListingCardProps["listing"] }) {
  const image = parseImages(listing.images)[0];
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card group overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={listing.title}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
        {listing.status === "sold" && (
          <span className="badge absolute left-2 top-2 bg-stone-900/80 text-white">Sold</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-stone-800">{listing.title}</h3>
          <span className="whitespace-nowrap text-sm font-bold text-brand-700">
            {formatMoney(listing.priceCents)}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {listing.condition} · {listing.category}
          {listing.seller && <> · {listing.seller.city}</>}
        </p>
      </div>
    </Link>
  );
}
