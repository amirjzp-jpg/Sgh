import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  await prisma.report.update({ where: { id: report.id }, data: { resolved: true } });
  return NextResponse.json({ ok: true });
}
