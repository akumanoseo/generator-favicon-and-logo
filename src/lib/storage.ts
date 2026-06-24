import type { BatchItem, FaviconConfig, ProjectSummary } from "@/lib/types";
import { renderSVG } from "@/lib/engine/render";
import { signatureString } from "@/lib/engine/uniqueness";
import { withDefaults } from "@/lib/engine/defaults";

/**
 * Persistence layer.
 *  - Local autosave → localStorage (instant, offline, survives reloads).
 *  - Named projects → SQLite via the /api/projects routes (Prisma).
 */

const LOCAL_KEY = "akuma-favicon-factory:autosave";

export interface SerializableState {
  config: FaviconConfig;
  batch: BatchItem[];
  recentColors: string[];
  name: string;
  projectId: string | null;
}

/** Strips cached SVG markup before persisting; it is re-derived on load. */
function serialize(state: SerializableState): string {
  return JSON.stringify({
    v: 1,
    config: state.config,
    recentColors: state.recentColors,
    name: state.name,
    projectId: state.projectId,
    batch: state.batch.map((b) => ({ id: b.id, config: b.config, createdAt: b.createdAt })),
  });
}

function deserialize(raw: string): SerializableState | null {
  try {
    const data = JSON.parse(raw);
    const batch: BatchItem[] = (data.batch ?? []).map((b: { id: string; config: Partial<FaviconConfig>; createdAt: number }) => {
      const config = withDefaults(b.config);
      return {
        id: b.id,
        config,
        createdAt: b.createdAt ?? Date.now(),
        svg: renderSVG(config),
        signature: signatureString(config),
      };
    });
    return {
      config: withDefaults(data.config),
      recentColors: data.recentColors ?? [],
      name: data.name ?? "Untitled project",
      projectId: data.projectId ?? null,
      batch,
    };
  } catch {
    return null;
  }
}

export function saveLocal(state: SerializableState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, serialize(state));
  } catch {
    // storage may be full (large batches with thumbnails) — fail silently.
  }
}

export function loadLocal(): SerializableState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? deserialize(raw) : null;
}

export function clearLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

// ── Server-backed named projects ──

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.projects ?? [];
}

export async function createProject(name: string, state: SerializableState, thumbnail: string | null): Promise<string | null> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data: serialize(state), thumbnail }),
  });
  if (!res.ok) return null;
  return (await res.json()).id ?? null;
}

export async function updateProject(id: string, name: string, state: SerializableState, thumbnail: string | null): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data: serialize(state), thumbnail }),
  });
  return res.ok;
}

export async function loadProject(id: string): Promise<SerializableState | null> {
  const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return deserialize(data.data);
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  return res.ok;
}
