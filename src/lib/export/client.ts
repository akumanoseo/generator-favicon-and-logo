import JSZip from "jszip";
import type { FaviconConfig } from "@/lib/types";
import { renderSVG } from "@/lib/engine/render";
import { renderLogoSVG, logoSize, getLogoIconInfo } from "@/lib/engine/logo";
import { resolveText } from "@/lib/engine/defaults";
import { masterPng, masterPngFromConfig, rasterizeLogoSvg, blobToBase64 } from "@/lib/rasterize";
import { signatureString } from "@/lib/engine/uniqueness";
import { ensureFontsLoaded, ensureFontCache, fontFamilyCss } from "@/lib/engine/fonts";
import { slugify } from "@/lib/export/assets";

export const LOGO_EXPORT_SIZES = [320, 640, 1024, 1920] as const;
export type LogoExportSize = (typeof LOGO_EXPORT_SIZES)[number];

export interface FaviconExportOptions {
  sizes: number[];
  png: boolean;
  webp: boolean;
  svg: boolean;
}

export interface LogoExportOptions {
  sizes: number[];
  webp: boolean;
  png: boolean;
  svg: boolean;
}

export type SaveMode = "folder" | "zip" | "files";

export interface ExportOptions {
  favicon: FaviconExportOptions;
  logo: LogoExportOptions;
  saveMode: SaveMode;
}

export function defaultExportOptions(): ExportOptions {
  return {
    favicon: {
      sizes: [32, 64, 180, 192, 512],
      png: false,
      webp: false,
      svg: true,
    },
    logo: {
      sizes: [640],
      webp: true,
      png: false,
      svg: false,
    },
    saveMode: "files",
  };
}

export interface ExportProgress {
  phase: "rasterizing" | "packaging" | "downloading" | "done";
  done: number;
  total: number;
  message: string;
}

export function estimateZipSize(count: number, opt: ExportOptions): number {
  let perItem = 0;
  const { favicon, logo } = opt;
  if (favicon.png) perItem += favicon.sizes.reduce((s, sz) => s + sz * sz * 0.18, 0);
  if (favicon.webp) perItem += favicon.sizes.reduce((s, sz) => s + sz * sz * 0.1, 0);
  if (favicon.svg) perItem += 600;
  if (logo.png) perItem += logo.sizes.reduce((s, sz) => s + sz * sz * 0.18, 0);
  if (logo.webp) perItem += logo.sizes.reduce((s, sz) => s + sz * sz * 0.1, 0);
  if (logo.svg) perItem += 1500;
  return Math.round(count * perItem * 0.35);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function brandSlugFromConfigs(configs: FaviconConfig[]): string {
  const first = configs[0];
  return slugify(first?.brandName ?? "") || "brand";
}

/** Write a single file via download link */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Writes ZIP blob into a File System Access directory (Chrome/Edge). */
async function extractZipToDirectory(
  zipBlob: Blob,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dirHandle: any,
  onProgress?: (p: ExportProgress) => void,
): Promise<void> {
  const zip = await JSZip.loadAsync(zipBlob);
  const files = Object.entries(zip.files).filter(([, f]) => !f.dir);
  let done = 0;
  for (const [path, file] of files) {
    const parts = path.split("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handle: any = dirHandle;
    for (const part of parts.slice(0, -1)) {
      handle = await handle.getDirectoryHandle(part, { create: true });
    }
    const name = parts[parts.length - 1];
    if (!name) continue;
    const fileHandle = await handle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(await file.async("arraybuffer"));
    await writable.close();
    done++;
    onProgress?.({ phase: "downloading", done, total: files.length, message: `Запись ${done}/${files.length}…` });
  }
}

export async function exportBatch(
  configs: FaviconConfig[],
  opt: ExportOptions,
  onProgress?: (p: ExportProgress) => void,
  modes?: ("favicon" | "logo")[],
): Promise<void> {
  const total = configs.length;
  await ensureFontCache();
  await ensureFontsLoaded();

  const items: { brand: string; mode: "favicon" | "logo"; svg: string; masterPng: string }[] = [];

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const mode = modes?.[i] ?? "favicon";

    let svg: string;
    let pngB64: string;

    if (mode === "logo") {
      const sz = logoSize(cfg.logo?.layout ?? "horizontal");
      svg = renderLogoSVG(cfg, sz);
      // Three-pass: SVG without ANY text → canvas, then favicon text + wordmark via ctx.fillText()
      // Chrome ignores @font-face in nested SVGs loaded as blob URLs, so both text
      // layers must be drawn via canvas API.
      const svgForRaster = renderLogoSVG(cfg, sz, true);
      const iconInfo = getLogoIconInfo(cfg, sz) ?? undefined;
      const wmFontId = cfg.logo?.wordmarkFont || cfg.fontFamily;
      const wmFamily = fontFamilyCss(wmFontId);
      const logoBlob = await rasterizeLogoSvg(svgForRaster, sz.width * 2, sz.height * 2, wmFamily, cfg, iconInfo);
      pngB64 = await blobToBase64(logoBlob);
    } else {
      svg = renderSVG(cfg);
      // Two-pass: SVG without text → canvas, then text via ctx.fillText()
      pngB64 = await masterPngFromConfig(cfg, 512);
    }

    items.push({
      brand: cfg.brandName || resolveText(cfg) || `brand-${i + 1}`,
      mode,
      svg,
      masterPng: pngB64,
    });

    onProgress?.({ phase: "rasterizing", done: i + 1, total, message: `Рендер ${i + 1}/${total}` });
  }

  onProgress?.({ phase: "packaging", done: total, total, message: "Упаковка…" });

  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, options: opt }),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${await res.text().catch(() => "")}`);

  const brandSlug = brandSlugFromConfigs(configs);
  const blob = await res.blob();

  if (opt.saveMode === "folder") {
    const fsa = typeof window !== "undefined" && "showDirectoryPicker" in window;
    if (fsa) {
      try {
        // @ts-expect-error -- FSA API not in all TS libs
        const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        await extractZipToDirectory(blob, dirHandle, onProgress);
        onProgress?.({ phase: "done", done: total, total, message: "Готово" });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") {
          onProgress?.({ phase: "done", done: total, total, message: "Отменено" });
          return;
        }
        // FSA failed — fall through to zip download
      }
    }
    // Browser doesn't support FSA — fall through to zip
  }

  if (opt.saveMode === "files") {
    // Download each file individually
    const zip = await JSZip.loadAsync(blob);
    const files = Object.entries(zip.files).filter(([, f]) => !f.dir);
    let done = 0;
    onProgress?.({ phase: "downloading", done: 0, total: files.length, message: "Скачивание файлов…" });
    for (const [path, file] of files) {
      const name = path.split("/").pop();
      if (!name) continue;
      const ab = await file.async("arraybuffer");
      const ext = name.split(".").pop() ?? "bin";
      const mimeMap: Record<string, string> = { webp: "image/webp", png: "image/png", svg: "image/svg+xml", ico: "image/x-icon" };
      const fileBlob = new Blob([ab], { type: mimeMap[ext] ?? "application/octet-stream" });
      downloadBlob(fileBlob, name);
      done++;
      onProgress?.({ phase: "downloading", done, total: files.length, message: `Файл ${done}/${files.length}` });
      // Small delay so browser doesn't block multiple downloads
      await new Promise((r) => setTimeout(r, 150));
    }
    onProgress?.({ phase: "done", done: total, total, message: "Готово" });
    return;
  }

  // ZIP mode (or folder fallback)
  onProgress?.({ phase: "downloading", done: total, total, message: "Скачивание архива…" });
  downloadBlob(blob, `${brandSlug}.zip`);
  onProgress?.({ phase: "done", done: total, total, message: "Готово" });
}

export async function recordFavicons(configs: FaviconConfig[], projectId?: string): Promise<void> {
  if (!configs.length) return;
  const items = configs.map((c) => ({
    brandName: c.brandName,
    text: resolveText(c),
    config: JSON.stringify(c),
    signature: signatureString(c),
    fontFamily: c.fontFamily,
    primaryColor: c.bgColor,
    shape: c.shape,
    projectId,
  }));
  await fetch("/api/favicons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch(() => {});
}
