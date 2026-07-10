import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ListingCard from "@/components/ListingCard";

export const dynamic = "force-dynamic";

const badges = [
  {
    icon: "🛡️",
    title: "Buyer protected",
    text: "Your money sits in escrow until you confirm the item arrived as described.",
  },
  {
    icon: "🏷️",
    title: "Free to sell",
    text: "No listing fees, no commission surprises. List it in under a minute.",
  },
  {
    icon: "🚲",
    title: "Local pickup, handled",
    text: "A Lolosel courier picks up from the seller and brings it to your door.",
  },
];

const steps = [
  ["List it", "Snap photos, set a price. Selling is free."],
  ["Agree on a price", "Chat and haggle with built-in offers."],
  ["We handle the handoff", "Buyer pays into escrow; our courier moves the item."],
  ["Everyone gets paid", "Buyer confirms, seller's wallet is credited."],
];

export default async function LandingPage() {
  const latest = await prisma.listing.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { seller: { select: { name: true, city: true } } },
  });

  return (
    <div className="space-y-16">
      <section className="rounded-3xl bg-brand-900 px-6 py-16 text-center text-white sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100/70">
          Vancouver&apos;s secondhand marketplace
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-6xl">
          Old Loves. <span className="text-amber-300">New Hands.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-brand-100/90">
          Sell what you&apos;ve outgrown, find what you&apos;ve been looking for. Free to sell,
          courier-run handoff, and payments held safely until the buyer says so.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/browse" className="btn-primary !bg-amber-400 !text-brand-900 hover:!bg-amber-300">
            Browse the goods
          </Link>
          <Link href="/listings/new" className="btn-secondary !border-brand-600 !bg-transparent !text-white hover:!bg-brand-800">
            Sell something
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {badges.map((b) => (
          <div key={b.title} className="card p-5">
            <div className="text-2xl">{b.icon}</div>
            <h2 className="mt-2 font-semibold text-stone-800">{b.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{b.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-stone-800">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title} className="card p-4">
              <span className="badge bg-brand-100 text-brand-800">Step {i + 1}</span>
              <h3 className="mt-2 text-sm font-semibold text-stone-800">{title}</h3>
              <p className="mt-1 text-xs text-stone-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {latest.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-stone-800">Fresh finds</h2>
            <Link href="/browse" className="text-sm font-semibold text-brand-700 hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latest.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
