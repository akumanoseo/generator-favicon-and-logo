import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/projects/:id — load a project's full state. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: project.id,
    name: project.name,
    data: project.data,
    thumbnail: project.thumbnail,
    updatedAt: project.updatedAt.toISOString(),
  });
}

/** PUT /api/projects/:id — overwrite a project (used by autosave & manual save). */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as { name?: string; data?: string; thumbnail?: string };
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.data !== undefined ? { data: body.data } : {}),
      ...(body.thumbnail !== undefined ? { thumbnail: body.thumbnail } : {}),
    },
  });
  return NextResponse.json({ id: project.id, updatedAt: project.updatedAt.toISOString() });
}

/** DELETE /api/projects/:id */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
