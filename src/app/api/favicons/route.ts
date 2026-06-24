import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/favicons?limit=500 — recent records for cross-session uniqueness + analytics. */
export async function GET(req: NextRequest) {
  const limit = Math.min(2000, Number(req.nextUrl.searchParams.get("limit")) || 500);
  const records = await prisma.favicon.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, brandName: true, signature: true, fontFamily: true, primaryColor: true, shape: true, config: true, createdAt: true },
  });
  return NextResponse.json({ count: records.length, records });
}

interface IncomingFavicon {
  brandName: string;
  text: string;
  config: string; // serialized FaviconConfig
  signature: string;
  fontFamily: string;
  primaryColor: string;
  shape: string;
  projectId?: string;
}

/** POST /api/favicons — bulk-record generated favicons. */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { items?: IncomingFavicon[] };
  const items = body.items ?? [];
  if (!items.length) return NextResponse.json({ created: 0 });
  await prisma.favicon.createMany({
    data: items.map((i) => ({
      brandName: i.brandName,
      text: i.text,
      config: i.config,
      signature: i.signature,
      fontFamily: i.fontFamily,
      primaryColor: i.primaryColor,
      shape: i.shape,
      projectId: i.projectId ?? null,
    })),
  });
  return NextResponse.json({ created: items.length });
}

/** DELETE /api/favicons — clears the generated-favicon history. */
export async function DELETE() {
  await prisma.favicon.deleteMany({});
  return NextResponse.json({ ok: true });
}
