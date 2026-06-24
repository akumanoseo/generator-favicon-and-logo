import type { FontDef } from "@/lib/types";

export const FONTS: FontDef[] = [
  // ── Display ──
  { id: "bebas", name: "Bebas Neue", family: "'Bebas Neue', sans-serif", googleSpec: "Bebas+Neue", weights: [400], category: "display" },
  { id: "anton", name: "Anton", family: "'Anton', sans-serif", googleSpec: "Anton", weights: [400], category: "display" },
  { id: "bungee", name: "Bungee", family: "'Bungee', sans-serif", googleSpec: "Bungee", weights: [400], category: "display" },
  { id: "archivo", name: "Archivo Black", family: "'Archivo Black', sans-serif", googleSpec: "Archivo+Black", weights: [400], category: "display" },
  { id: "russo", name: "Russo One", family: "'Russo One', sans-serif", googleSpec: "Russo+One", weights: [400], category: "display" },
  { id: "teko", name: "Teko", family: "'Teko', sans-serif", googleSpec: "Teko:wght@400;500;600;700", weights: [400, 500, 600, 700], category: "display" },
  { id: "orbitron", name: "Orbitron", family: "'Orbitron', sans-serif", googleSpec: "Orbitron:wght@400;500;700;900", weights: [400, 500, 700, 900], category: "display" },
  { id: "bungee_shade", name: "Bungee Shade", family: "'Bungee Shade', sans-serif", googleSpec: "Bungee+Shade", weights: [400], category: "display" },
  { id: "faster_one", name: "Faster One", family: "'Faster One', sans-serif", googleSpec: "Faster+One", weights: [400], category: "display" },
  { id: "black_ops", name: "Black Ops One", family: "'Black Ops One', sans-serif", googleSpec: "Black+Ops+One", weights: [400], category: "display" },
  { id: "boogaloo", name: "Boogaloo", family: "'Boogaloo', sans-serif", googleSpec: "Boogaloo", weights: [400], category: "display" },
  { id: "fredoka", name: "Fredoka One", family: "'Fredoka One', sans-serif", googleSpec: "Fredoka+One", weights: [400], category: "display" },
  { id: "sigmar", name: "Sigmar One", family: "'Sigmar One', sans-serif", googleSpec: "Sigmar+One", weights: [400], category: "display" },
  { id: "passion", name: "Passion One", family: "'Passion One', sans-serif", googleSpec: "Passion+One:wght@400;700;900", weights: [400, 700, 900], category: "display" },
  { id: "graduate", name: "Graduate", family: "'Graduate', sans-serif", googleSpec: "Graduate", weights: [400], category: "display" },
  { id: "audiowide", name: "Audiowide", family: "'Audiowide', sans-serif", googleSpec: "Audiowide", weights: [400], category: "display" },
  { id: "chakra", name: "Chakra Petch", family: "'Chakra Petch', sans-serif", googleSpec: "Chakra+Petch:wght@400;600;700", weights: [400, 600, 700], category: "display" },
  { id: "righteous", name: "Righteous", family: "'Righteous', sans-serif", googleSpec: "Righteous", weights: [400], category: "display" },
  { id: "iceland", name: "Iceland", family: "'Iceland', sans-serif", googleSpec: "Iceland", weights: [400], category: "display" },
  { id: "michroma", name: "Michroma", family: "'Michroma', sans-serif", googleSpec: "Michroma", weights: [400], category: "display" },
  { id: "quantico", name: "Quantico", family: "'Quantico', sans-serif", googleSpec: "Quantico:wght@400;700", weights: [400, 700], category: "display" },
  { id: "saira_sc", name: "Saira SC", family: "'Saira Stencil One', sans-serif", googleSpec: "Saira+Stencil+One", weights: [400], category: "display" },
  // ── Sans ──
  { id: "montserrat", name: "Montserrat", family: "'Montserrat', sans-serif", googleSpec: "Montserrat:wght@400;600;700;800;900", weights: [400, 600, 700, 800, 900], category: "sans" },
  { id: "oswald", name: "Oswald", family: "'Oswald', sans-serif", googleSpec: "Oswald:wght@400;500;600;700", weights: [400, 500, 600, 700], category: "sans" },
  { id: "poppins", name: "Poppins", family: "'Poppins', sans-serif", googleSpec: "Poppins:wght@400;600;700;800;900", weights: [400, 600, 700, 800, 900], category: "sans" },
  { id: "rubik", name: "Rubik", family: "'Rubik', sans-serif", googleSpec: "Rubik:wght@400;500;700;900", weights: [400, 500, 700, 900], category: "sans" },
  { id: "inter", name: "Inter", family: "'Inter', sans-serif", googleSpec: "Inter:wght@400;600;700;800;900", weights: [400, 600, 700, 800, 900], category: "sans" },
  { id: "rajdhani", name: "Rajdhani", family: "'Rajdhani', sans-serif", googleSpec: "Rajdhani:wght@400;500;600;700", weights: [400, 500, 600, 700], category: "sans" },
  { id: "exo2", name: "Exo 2", family: "'Exo 2', sans-serif", googleSpec: "Exo+2:wght@400;600;700;800;900", weights: [400, 600, 700, 800, 900], category: "sans" },
  { id: "nunito", name: "Nunito", family: "'Nunito', sans-serif", googleSpec: "Nunito:wght@400;700;800;900", weights: [400, 700, 800, 900], category: "sans" },
  { id: "barlow", name: "Barlow Condensed", family: "'Barlow Condensed', sans-serif", googleSpec: "Barlow+Condensed:wght@400;600;700;800", weights: [400, 600, 700, 800], category: "sans" },
  { id: "space_grotesk", name: "Space Grotesk", family: "'Space Grotesk', sans-serif", googleSpec: "Space+Grotesk:wght@400;600;700", weights: [400, 600, 700], category: "sans" },
  { id: "urbanist", name: "Urbanist", family: "'Urbanist', sans-serif", googleSpec: "Urbanist:wght@400;700;800;900", weights: [400, 700, 800, 900], category: "sans" },
  { id: "dm_sans", name: "DM Sans", family: "'DM Sans', sans-serif", googleSpec: "DM+Sans:wght@400;700;900", weights: [400, 700, 900], category: "sans" },
  // ── Serif ──
  { id: "cinzel", name: "Cinzel", family: "'Cinzel', serif", googleSpec: "Cinzel:wght@400;600;700;900", weights: [400, 600, 700, 900], category: "serif" },
  { id: "playfair", name: "Playfair Display", family: "'Playfair Display', serif", googleSpec: "Playfair+Display:wght@400;700;900", weights: [400, 700, 900], category: "serif" },
  { id: "bodoni", name: "Bodoni Moda", family: "'Bodoni Moda', serif", googleSpec: "Bodoni+Moda:wght@400;700;900", weights: [400, 700, 900], category: "serif" },
  { id: "cormorant", name: "Cormorant", family: "'Cormorant', serif", googleSpec: "Cormorant:wght@400;600;700", weights: [400, 600, 700], category: "serif" },
];

const FONT_BY_ID = new Map(FONTS.map((f) => [f.id, f]));

export function getFont(id: string): FontDef {
  return FONT_BY_ID.get(id) ?? FONTS[0];
}

export function fontFamilyCss(id: string): string {
  return getFont(id).family;
}

/** Builds the single Google Fonts stylesheet URL that loads every face. */
export function googleFontsHref(): string {
  const families = FONTS.map((f) => `family=${f.googleSpec}`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Ensures all favicon fonts are loaded in the browser before rasterizing,
 * so canvas exports render with the correct glyphs (not a fallback).
 */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const probes: Promise<unknown>[] = [];
  for (const f of FONTS) {
    const fam = f.family.split(",")[0].replace(/'/g, "");
    for (const w of f.weights) {
      probes.push(document.fonts.load(`${w} 72px "${fam}"`).catch(() => {}));
    }
  }
  await Promise.all(probes);
  await document.fonts.ready;
}

/**
 * Cache of "fontId|weight" → base64 @font-face CSS block.
 * SVGs rendered as <img> from a data-uri cannot load external URLs (Google
 * Fonts), so for rasterisation we embed the font bytes directly in the SVG.
 */
const fontBase64Cache = new Map<string, string>();
let fontCacheLoading: Promise<void> | null = null;

async function bufToBase64(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Fetches the Google Fonts CSS2 stylesheet for a single spec, parses out
 * every @font-face url(), downloads each woff2/woff, and stores base64
 * @font-face blocks in fontBase64Cache keyed by "family|weight".
 */
async function cacheFontSpec(spec: string, familyName: string): Promise<void> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  let css: string;
  try {
    // Note: browsers block setting User-Agent via fetch(). Google will return
    // TTF format without a modern UA — that is fine, TTF also works in SVG.
    const res = await fetch(cssUrl);
    css = await res.text();
  } catch {
    return;
  }

  // Parse all @font-face blocks from the CSS response.
  const blockRe = /@font-face\s*\{([^}]+)\}/g;
  let blockMatch: RegExpExecArray | null;
  const downloads: Promise<void>[] = [];

  while ((blockMatch = blockRe.exec(css)) !== null) {
    const block = blockMatch[1];
    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/url\(([^)]+)\)/);
    const formatMatch = block.match(/format\(['"]?([^'")\s]+)['"]?\)/);
    if (!weightMatch || !urlMatch) continue;

    const weight = weightMatch[1];
    const url = urlMatch[1].replace(/['"]/g, "");
    const fmt = formatMatch ? formatMatch[1] : (url.endsWith(".woff") ? "woff" : url.endsWith(".ttf") ? "truetype" : "woff2");
    const mime =
      fmt === "woff" ? "font/woff" :
      fmt === "truetype" ? "font/ttf" :
      "font/woff2";
    // Use "truetype" as the CSS format() value for .ttf files
    const format = fmt;
    const key = `${familyName}|${weight}`;
    if (fontBase64Cache.has(key)) continue;

    downloads.push(
      (async () => {
        try {
          const r = await fetch(url);
          const b64 = await bufToBase64(await r.arrayBuffer());
          const cssBlock =
            `@font-face{font-family:${JSON.stringify(familyName)};` +
            `font-weight:${weight};font-style:normal;` +
            `src:url('data:${mime};base64,${b64}') format('${fmt}');}`;
          fontBase64Cache.set(key, cssBlock);
        } catch {
          // best-effort
        }
      })(),
    );
  }
  await Promise.all(downloads);
}

async function buildFontCache(): Promise<void> {
  if (typeof fetch === "undefined") return;
  await Promise.all(
    FONTS.map((f) => {
      const familyName = f.family.split(",")[0].replace(/'/g, "").trim();
      return cacheFontSpec(f.googleSpec, familyName);
    }),
  );
}

/** Call once before exporting — ensures every font is cached as base64. */
export async function ensureFontCache(): Promise<void> {
  if (!fontCacheLoading) fontCacheLoading = buildFontCache();
  await fontCacheLoading;
}

/**
 * Returns a CSS string (no <style> tag) with all @font-face blocks for the
 * given font id. Returns "" if cache isn't ready yet (live preview falls back
 * to the page stylesheet; export always awaits ensureFontCache first).
 */
export function fontFaceCssForId(id: string): string {
  const font = getFont(id);
  const familyName = font.family.split(",")[0].replace(/'/g, "").trim();
  const blocks: string[] = [];
  for (const w of font.weights) {
    const block = fontBase64Cache.get(`${familyName}|${w}`);
    if (block) blocks.push(block);
  }
  return blocks.join("");
}
