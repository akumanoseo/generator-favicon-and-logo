import { NextRequest } from "next/server";
import JSZip from "jszip";
import sharp from "sharp";
import { slugify } from "@/lib/export/assets";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ExportItem {
  brand: string;
  mode: "favicon" | "logo";
  svg: string;
  masterPng: string;
}

interface FaviconExportOptions {
  sizes: number[];
  png: boolean;
  webp: boolean;
  svg: boolean;
}

interface LogoExportOptions {
  sizes: number[];
  webp: boolean;
  png: boolean;
  svg: boolean;
}

interface ExportOptions {
  favicon: FaviconExportOptions;
  logo: LogoExportOptions;
  saveMode?: string;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

export async function POST(req: NextRequest) {
  let body: { items?: ExportItem[]; options?: ExportOptions };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const items = body.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return new Response("No items to export", { status: 400 });
  }
  const opt: ExportOptions = body.options ?? {
    favicon: { sizes: [32, 64, 180, 192, 512], png: true, webp: true, svg: true },
    logo: { sizes: [1920], webp: true, png: false, svg: false },
  };

  const zip = new JSZip();

  // If multiple brands in batch, group by brand slug into subfolders.
  const uniqueBrands = new Set(items.map((it) => slugify(it.brand)));
  const useSubfolders = uniqueBrands.size > 1;

  const usedNames = new Map<string, number>();

  await mapLimit(items, 4, async (item) => {
    const baseSlug = slugify(item.brand);
    const n = usedNames.get(baseSlug) ?? 0;
    usedNames.set(baseSlug, n + 1);
    const folderName = n === 0 ? baseSlug : `${baseSlug}-${n + 1}`;

    // Files go into a subfolder per brand when batch has multiple brands,
    // otherwise directly into the ZIP root.
    const folder = useSubfolders ? zip.folder(folderName)! : zip;

    const master = Buffer.from(item.masterPng, "base64");

    if (item.mode === "logo") {
      const logoOpt = opt.logo;
      const logoSizes = logoOpt.sizes?.length ? logoOpt.sizes : [1920];
      for (const size of logoSizes) {
        const suffix = logoSizes.length > 1 ? `-${size}` : "";
        if (logoOpt.webp) {
          const buf = await sharp(master)
            .resize(size, null, { fit: "inside", withoutEnlargement: false })
            .webp({ quality: 92 })
            .toBuffer();
          folder.file(`logo${suffix}.webp`, buf);
        }
        if (logoOpt.png) {
          const buf = await sharp(master)
            .resize(size, null, { fit: "inside", withoutEnlargement: false })
            .png({ compressionLevel: 9 })
            .toBuffer();
          folder.file(`logo${suffix}.png`, buf);
        }
      }
      if (logoOpt.svg) {
        folder.file("logo.svg", item.svg);
      }
    } else {
      // Favicon
      const favOpt = opt.favicon;
      const pngCache = new Map<number, Buffer>();
      const getPng = async (size: number): Promise<Buffer> => {
        const cached = pngCache.get(size);
        if (cached) return cached;
        const buf = await sharp(master)
          .resize(size, size, { fit: "contain", background: TRANSPARENT })
          .png({ compressionLevel: 9 })
          .toBuffer();
        pngCache.set(size, buf);
        return buf;
      };

      if (favOpt.png) {
        for (const size of favOpt.sizes) {
          folder.file(`favicon-${size}.png`, await getPng(size));
        }
      }
      if (favOpt.webp) {
        for (const size of favOpt.sizes) {
          const buf = await sharp(master)
            .resize(size, size, { fit: "contain", background: TRANSPARENT })
            .webp({ quality: 92 })
            .toBuffer();
          folder.file(`favicon-${size}.webp`, buf);
        }
      }
      if (favOpt.svg) {
        folder.file("favicon.svg", item.svg);
      }
    }
  });

  const nodeStream = zip.generateInternalStream({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    streamFiles: true,
  });

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream
        .on("data", (chunk: Uint8Array) => controller.enqueue(chunk))
        .on("error", (err: Error) => controller.error(err))
        .on("end", () => controller.close());
      nodeStream.resume();
    },
    cancel() {
      nodeStream.pause();
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const firstName = slugify(items[0]?.brand ?? "brand");
  const zipName = items.length === 1 ? firstName : `akuma-batch-${stamp}`;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
