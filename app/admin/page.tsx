import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import AdminReportActions from "@/components/AdminReportActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!user.isAdmin) redirect("/");

  const reports = await prisma.report.findMany({
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    include: {
      reporter: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, status: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-stone-800">Admin — flagged content</h1>
      <p className="mt-1 text-sm text-stone-500">
        {reports.filter((r) => !r.resolved).length} open report(s)
      </p>

      {reports.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-stone-500">No reports. Quiet day 🎉</div>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className={`card p-4 ${r.resolved ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800">
                    {r.listing ? (
                      <>
                        Listing:{" "}
                        <Link href={`/listings/${r.listing.id}`} className="text-brand-700 hover:underline">
                          {r.listing.title}
                        </Link>{" "}
                        <span className="text-xs text-stone-400">({r.listing.status})</span>
                      </>
                    ) : r.targetUser ? (
                      <>
                        User:{" "}
                        <Link href={`/profile/${r.targetUser.id}`} className="text-brand-700 hover:underline">
                          {r.targetUser.name}
                        </Link>
                      </>
                    ) : (
                      "Unknown target"
                    )}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">&ldquo;{r.reason}&rdquo;</p>
                  <p className="mt-1 text-xs text-stone-400">
                    Reported by {r.reporter.name} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                {r.resolved ? (
                  <span className="badge bg-stone-100 text-stone-500">Resolved</span>
                ) : (
                  <AdminReportActions
                    reportId={r.id}
                    listingId={r.listing?.status === "active" ? r.listing.id : undefined}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
