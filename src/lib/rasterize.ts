"use client";

import type { FaviconConfig } from "@/lib/types";
import { CANVAS } from "@/lib/types";
import { ensureFontsLoaded } from "@/lib/engine/fonts";
import { gradientVector } from "@/lib/engine/colors";
import { renderSVGNoText, getTextParams } from "@/lib/engine/render";
import type { LogoIconInfo } from "@/lib/engine/logo";

/**
 * Rasterizer — SVG → canvas → PNG Blob.
 *
 * Chrome hard-isolates SVG loaded via <img>/blob URL: @font-face inside the
 * SVG is ignored, page fonts are inaccessible. Solution:
 *
 *   1. renderSVGNoText() — produce SVG without any <text> elements
 *   2. Draw that SVG via blob→<img>→canvas (shapes, gradients, effects work fine)
 *   3. Draw text on top with ctx.fillText() — fonts come from document.fonts
 *      (already loaded by the Google Fonts <link> in <head>)
 */

function ensureXmlns(svg: string): string {
  if (svg.includes("xmlns=")) return svg;
  return svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("SVG img failed to load"));
    img.src = url;
  });
}

async function drawSvgToCanvas(
  svgStr: string,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const blob = new Blob([ensureXmlns(svgStr)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Parse hex/rgb color to [r, g, b] array */
function parseColor(color: string): [number, number, number] {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }
  return [255, 255, 255];
}

/**
 * Creates a gradient fill for canvas, matching the SVG linearGradient.
 * angle is in degrees (0=top→bottom, 90=left→right, etc.)
 */
function makeGradient(
  ctx: CanvasRenderingContext2D,
  from: string,
  to: string,
  angle: number,
  cx: number,
  cy: number,
  width: number,
  height: number,
): CanvasGradient {
  const v = gradientVector(angle);
  // v.x1 etc. are strings like "50%"
  const x1 = cx + (parseFloat(v.x1) / 100 - 0.5) * width;
  const y1 = cy + (parseFloat(v.y1) / 100 - 0.5) * height;
  const x2 = cx + (parseFloat(v.x2) / 100 - 0.5) * width;
  const y2 = cy + (parseFloat(v.y2) / 100 - 0.5) * height;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  return grad;
}

/** Draw text on canvas matching exactly what the SVG engine would produce */
function drawTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  params: ReturnType<typeof getTextParams>,
  scale: number,
): void {
  const {
    text, x, y, fontFamily, fontSize, fontWeight,
    letterSpacing, rotation, italic,
    textAnchor, baseline,
    fill, gradientEnabled, gradientFrom, gradientTo, gradientAngle,
  } = params;

  if (!text) return;

  const sx = x * scale;
  const sy = y * scale;
  const sf = fontSize * scale;
  const sls = letterSpacing * scale;

  ctx.save();

  // Match SVG transform="translate(x y) rotate() skewX()"
  ctx.translate(sx, sy);
  if (rotation) ctx.rotate((rotation * Math.PI) / 180);
  if (italic) {
    // skewX(-italic) in SVG = ctx.transform(1, 0, tan(italic*pi/180), 1, 0, 0)
    const sk = Math.tan((italic * Math.PI) / 180);
    ctx.transform(1, 0, -sk, 1, 0, 0);
  }

  const fontStyle = "normal";
  ctx.font = `${fontStyle} ${fontWeight} ${sf}px ${fontFamily}`;
  ctx.textAlign = textAnchor === "start" ? "left" : textAnchor === "end" ? "right" : "center";
  ctx.textBaseline = baseline === "alphabetic" ? "alphabetic" : "middle";

  // Measure total text width to position gradient correctly
  const totalWidth = ctx.measureText(text).width;

  // Set fill — gradient or solid
  if (gradientEnabled) {
    const anchorOffX = textAnchor === "middle" ? -totalWidth / 2 : textAnchor === "end" ? -totalWidth : 0;
    ctx.fillStyle = makeGradient(ctx, gradientFrom, gradientTo, gradientAngle,
      anchorOffX + totalWidth / 2, 0, totalWidth, sf);
  } else {
    ctx.fillStyle = fill;
  }

  // Draw with letter spacing support
  if (sls === 0) {
    ctx.fillText(text, 0, 0);
  } else {
    // Manual letter-spacing: draw char by char
    const chars = [...text];
    let cursorX = 0;
    // Calculate starting x based on text-anchor
    if (textAnchor === "middle") {
      cursorX = -totalWidth / 2;
    } else if (textAnchor === "end") {
      cursorX = -totalWidth;
    }
    for (const ch of chars) {
      ctx.fillText(ch, cursorX, 0);
      cursorX += ctx.measureText(ch).width + sls;
    }
  }

  ctx.restore();
}

/** Rasterizes a FaviconConfig to a PNG Blob at the given pixel size. */
export async function rasterizeConfig(config: FaviconConfig, size: number): Promise<Blob> {
  await ensureFontsLoaded();
  await document.fonts.ready;

  const scale = size / CANVAS;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Pass 1: draw SVG without text (shapes, bg, effects, icon layer if any)
  const svgNoText = renderSVGNoText(config);
  await drawSvgToCanvas(svgNoText, canvas);

  // Pass 2: draw text via canvas API using document.fonts
  const textParams = getTextParams(config);
  drawTextOnCanvas(ctx, textParams, scale);

  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  canvas.width = 0;
  canvas.height = 0;
  if (!out) throw new Error("toBlob failed");
  return out;
}

/** Rasterizes a logo SVG string (which has wordmark handled separately).
 *  For logo we still use SVG→img because the wordmark font issue is handled
 *  differently — see rasterizeLogoConfig(). */
export async function rasterizeSvg(svg: string, width: number, height = width): Promise<Blob> {
  await ensureFontsLoaded();
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await drawSvgToCanvas(svg, canvas);

  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  canvas.width = 0;
  canvas.height = 0;
  if (!out) throw new Error("toBlob failed");
  return out;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Produces a base64 master PNG from a FaviconConfig at given size. */
export async function masterPngFromConfig(config: FaviconConfig, size = 512): Promise<string> {
  const blob = await rasterizeConfig(config, size);
  return blobToBase64(blob);
}

/** Legacy: produces a base64 master PNG from raw SVG (used for logo export). */
export async function masterPng(svg: string, width = 512, height = width): Promise<string> {
  const blob = await rasterizeSvg(svg, width, height);
  return blobToBase64(blob);
}

// ─── Logo rasterizer ────────────────────────────────────────────────────────
// Logo has a wordmark text element that also needs ctx.fillText() treatment.

interface LogoTextParams {
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  italic: number;
  textAnchor: "start" | "middle";
  fill: string;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
}

/** Strips the wordmark <text> element from the logo SVG and returns both.
 *  Matches specifically by data-role="wordmark" to avoid accidentally removing
 *  the favicon icon's <text> element inside the nested <svg>. */
function splitLogoSvg(svg: string): { svgNoText: string; textEl: string | null } {
  const textMatch = svg.match(/<text\b[^>]*\bdata-role="wordmark"[^>]*>[\s\S]*?<\/text>/);
  if (!textMatch) return { svgNoText: svg, textEl: null };
  const svgNoText = svg.replace(textMatch[0], "");
  return { svgNoText, textEl: textMatch[0] };
}

/** Parse a wordmark <text> SVG element into canvas draw params */
function parseLogoTextEl(
  textEl: string,
  svgWidth: number,
  svgHeight: number,
): LogoTextParams | null {
  const xM = textEl.match(/\bx="([^"]+)"/);
  const yM = textEl.match(/\by="([^"]+)"/);
  const fsM = textEl.match(/font-size="([^"]+)"/);
  const fwM = textEl.match(/font-weight="([^"]+)"/);
  const ffM = textEl.match(/font-family="([^"]+)"/);
  const taM = textEl.match(/text-anchor="([^"]+)"/);
  const lsM = textEl.match(/letter-spacing="([^"]+)"/);
  // fill can be a color or url(#id) for gradient — we handle solid color only here;
  // gradient in logo is rendered as solid fallback (rare edge case)
  const fillM = textEl.match(/fill="([^"]+)"/);
  // italic is stored as transform="skewX(-N)"
  const skewM = textEl.match(/skewX\(([^)]+)\)/);
  // text content
  const contentM = textEl.match(/>([^<]*)<\/text>/);

  if (!xM || !yM || !fsM || !contentM) return null;

  return {
    text: contentM[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'),
    x: parseFloat(xM[1]),
    y: parseFloat(yM[1]),
    fontFamily: ffM ? ffM[1].replace(/&quot;/g, '"') : "sans-serif",
    fontSize: parseFloat(fsM[1]),
    fontWeight: fwM ? parseInt(fwM[1]) : 700,
    letterSpacing: lsM ? parseFloat(lsM[1]) : 0,
    italic: skewM ? Math.abs(parseFloat(skewM[1])) : 0,
    textAnchor: (taM?.[1] ?? "start") === "middle" ? "middle" : "start",
    fill: fillM && !fillM[1].startsWith("url") ? fillM[1] : "#ffffff",
    gradientEnabled: false,
    gradientFrom: "#ffffff",
    gradientTo: "#ffffff",
    gradientAngle: 90,
  };
}

function drawLogoText(
  ctx: CanvasRenderingContext2D,
  params: LogoTextParams,
  scale: number,
): void {
  const { text, x, y, fontFamily, fontSize, fontWeight, letterSpacing, italic, textAnchor, fill } = params;
  if (!text) return;

  const sx = x * scale;
  const sy = y * scale;
  const sf = fontSize * scale;
  const sls = letterSpacing * scale;

  ctx.save();
  ctx.translate(sx, sy);
  if (italic) {
    const sk = Math.tan((italic * Math.PI) / 180);
    ctx.transform(1, 0, -sk, 1, 0, 0);
  }

  ctx.font = `normal ${fontWeight} ${sf}px ${fontFamily}`;
  ctx.textAlign = textAnchor === "middle" ? "center" : "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fill;

  if (sls === 0) {
    ctx.fillText(text, 0, 0);
  } else {
    const chars = [...text];
    const totalWidth = ctx.measureText(text).width;
    let cursorX = textAnchor === "middle" ? -totalWidth / 2 : 0;
    for (const ch of chars) {
      ctx.fillText(ch, cursorX, 0);
      cursorX += ctx.measureText(ch).width + sls;
    }
  }

  ctx.restore();
}

/**
 * Rasterizes a logo SVG with proper font rendering via three-pass canvas draw.
 *
 * `svg` must be generated with `skipFaviconText=true` so the favicon icon's
 * <text> is absent — Chrome ignores @font-face in nested SVGs loaded as blob
 * URLs, so we redraw both the favicon text and the wordmark via canvas API.
 *
 * Pass 1: draw SVG (no favicon text, no wordmark) via blob URL
 * Pass 2: draw favicon icon text via ctx.fillText() at the correct position
 * Pass 3: draw wordmark text via ctx.fillText()
 */
export async function rasterizeLogoSvg(
  svg: string,
  width: number,
  height: number,
  wordmarkFontFamily: string,
  faviconConfig?: FaviconConfig,
  iconInfo?: LogoIconInfo,
): Promise<Blob> {
  await ensureFontsLoaded();
  await document.fonts.ready;

  const fam = wordmarkFontFamily.split(",")[0].replace(/'/g, "").trim();
  await document.fonts.load(`700 72px "${fam}"`).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Pass 1: render SVG without wordmark text (favicon text already absent)
  const { svgNoText, textEl } = splitLogoSvg(svg);
  await drawSvgToCanvas(svgNoText, canvas);

  // Pass 2: draw favicon icon text via canvas API at the icon's position
  if (faviconConfig && iconInfo) {
    const logoScale = width / iconInfo.svgWidth;
    const faviconScale = (iconInfo.size / CANVAS) * logoScale;
    const textParams = getTextParams(faviconConfig);
    ctx.save();
    ctx.translate(iconInfo.x * logoScale, iconInfo.y * logoScale);
    drawTextOnCanvas(ctx, textParams, faviconScale);
    ctx.restore();
  }

  // Pass 3: draw wordmark text via canvas API
  if (textEl) {
    const params = parseLogoTextEl(textEl, width, height);
    if (params) {
      params.fontFamily = wordmarkFontFamily;
      const vbMatch = svgNoText.match(/viewBox="0 0 (\d+) (\d+)"/);
      const svgW = vbMatch ? parseInt(vbMatch[1]) : 1024;
      const scale = width / svgW;
      drawLogoText(ctx, params, scale);
    }
  }

  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  canvas.width = 0;
  canvas.height = 0;
  if (!out) throw new Error("toBlob failed");
  return out;
}
