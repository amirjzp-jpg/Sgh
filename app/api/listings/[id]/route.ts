import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { listingUpdateSchema } from "@/lib/validation";

// Owner (or admin) can relist or remove a listing. Sold listings are frozen.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }
  if (listing.status === "sold") {
    return NextResponse.json({ error: "Sold listings can't be changed" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = listingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await prisma.listing.update({ where: { id: listing.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
