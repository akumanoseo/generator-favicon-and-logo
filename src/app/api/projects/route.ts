import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/projects — list project summaries (newest first). */
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { favicons: true } },
    },
  });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      thumbnail: p.thumbnail,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      faviconCount: p._count.favicons,
    })),
  });
}

/** POST /api/projects — create a new saved project. */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string; data?: string; thumbnail?: string };
  if (!body.data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
  const project = await prisma.project.create({
    data: {
      name: body.name?.trim() || "Untitled project",
      data: body.data,
      thumbnail: body.thumbnail ?? null,
    },
  });
  return NextResponse.json({ id: project.id });
}
