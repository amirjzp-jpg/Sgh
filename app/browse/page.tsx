import { prisma } from "@/lib/prisma";
import ListingCard from "@/components/ListingCard";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
};

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q?.trim() ?? "";
  const category = CATEGORIES.find((c) => c === searchParams.category);
  const condition = CONDITIONS.find((c) => c === searchParams.condition);
  const min = Number(searchParams.min);
  const max = Number(searchParams.max);

  const listings = await prisma.listing.findMany({
    where: {
      status: "active",
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
      ...(category ? { category } : {}),
      ...(condition ? { condition } : {}),
      priceCents: {
        ...(Number.isFinite(min) && min > 0 ? { gte: Math.round(min * 100) } : {}),
        ...(Number.isFinite(max) && max > 0 ? { lte: Math.round(max * 100) } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true, city: true } } },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <form className="card sticky top-20 space-y-4 p-4" method="GET">
          <div>
            <label className="label" htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="teak, bike, gore-tex…" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={category ?? ""} className="input">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="condition">Condition</label>
            <select id="condition" name="condition" defaultValue={condition ?? ""} className="input">
              <option value="">Any condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Price (CAD)</span>
            <div className="flex items-center gap-2">
              <input name="min" defaultValue={searchParams.min ?? ""} placeholder="Min"
                inputMode="numeric" className="input" />
              <span className="text-stone-400">–</span>
              <input name="max" defaultValue={searchParams.max ?? ""} placeholder="Max"
                inputMode="numeric" className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Apply filters</button>
        </form>
      </aside>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="font-serif text-2xl font-bold text-stone-800">Browse</h1>
          <span className="text-sm text-stone-500">
            {listings.length} item{listings.length === 1 ? "" : "s"}
          </span>
        </div>
        {listings.length === 0 ? (
          <div className="card p-10 text-center text-stone-500">
            Nothing matches those filters — try widening the search.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
