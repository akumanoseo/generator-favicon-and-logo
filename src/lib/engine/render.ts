import type { FaviconConfig, GradientConfig } from "@/lib/types";
import { CANVAS } from "@/lib/types";
import { fontFamilyCss, fontFaceCssForId } from "@/lib/engine/fonts";
import { resolveText } from "@/lib/engine/defaults";
import { gradientVector, lighten, darken } from "@/lib/engine/colors";
import { renderLayers } from "@/lib/engine/layers";

/**
 * Rendering engine.
 *
 * Pure function: FaviconConfig → self-contained 512×512 SVG markup.
 * This is the single render path used by the live editor, the preview
 * grid, the batch thumbnails and the export rasterizer.
 *
 * Every gradient/filter id is suffixed with a per-render uid so that any
 * number of SVGs can coexist in the same document without id collisions.
 */

let uidCounter = 0;
function nextUid(): string {
  uidCounter = (uidCounter + 1) % 1_000_000;
  return `f${uidCounter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds an SVG <linearGradient> def + the url() reference. */
function gradientDef(uid: string, key: string, g: GradientConfig): { def: string; ref: string } {
  const id = `grad-${key}-${uid}`;
  const v = gradientVector(g.angle);
  const def = `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">` +
    `<stop offset="0%" stop-color="${g.from}"/>` +
    `<stop offset="100%" stop-color="${g.to}"/>` +
    `</linearGradient>`;
  return { def, ref: `url(#${id})` };
}

/** Metallic sheen gradient for text fill. */
function metallicDef(uid: string, base: string): { def: string; ref: string } {
  const id = `metal-${uid}`;
  const def = `<linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">` +
    `<stop offset="0%" stop-color="${lighten(base, 0.85)}"/>` +
    `<stop offset="45%" stop-color="${lighten(base, 0.25)}"/>` +
    `<stop offset="55%" stop-color="${darken(base, 0.15)}"/>` +
    `<stop offset="100%" stop-color="${lighten(base, 0.6)}"/>` +
    `</linearGradient>`;
  return { def, ref: `url(#${id})` };
}

/** Geometry of the active shape, as an SVG element + a clip element. */
function shapeGeometry(config: FaviconConfig, uid: string): {
  clipId: string;
  clipDef: string;
  draw: (paint: string, extra: string) => string;
} | null {
  if (config.shape === "none") return null;
  const pad = config.padding;
  const x = pad;
  const y = pad;
  const s = CANVAS - pad * 2;
  const cx = CANVAS / 2;
  const cy = CANVAS / 2;
  const clipId = `clip-${uid}`;

  let primitive: (paint: string, extra: string) => string;
  let clipShape: string;

  switch (config.shape) {
    case "square":
      primitive = (p, e) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${p}" ${e}/>`;
      clipShape = `<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`;
      break;
    case "rounded": {
      const r = Math.min(config.cornerRadius, s / 2);
      primitive = (p, e) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" ry="${r}" fill="${p}" ${e}/>`;
      clipShape = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" ry="${r}"/>`;
      break;
    }
    case "circle": {
      const r = s / 2;
      primitive = (p, e) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p}" ${e}/>`;
      clipShape = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      break;
    }
    case "squircle": {
      const d = squirclePath(x, y, s);
      primitive = (p, e) => `<path d="${d}" fill="${p}" ${e}/>`;
      clipShape = `<path d="${d}"/>`;
      break;
    }
    case "hexagon": {
      const d = hexagonPath(cx, cy, s / 2);
      primitive = (p, e) => `<path d="${d}" fill="${p}" ${e}/>`;
      clipShape = `<path d="${d}"/>`;
      break;
    }
    default:
      return null;
  }

  return {
    clipId,
    clipDef: `<clipPath id="${clipId}">${clipShape}</clipPath>`,
    draw: primitive,
  };
}

/** Superellipse (squircle) path, n≈4, sampled as a smooth polyline. */
function squirclePath(x: number, y: number, size: number): string {
  const a = size / 2;
  const cx = x + a;
  const cy = y + a;
  const n = 4; // exponent
  const steps = 48;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const px = cx + Math.sign(ct) * a * Math.pow(Math.abs(ct), 2 / n);
    const py = cy + Math.sign(st) * a * Math.pow(Math.abs(st), 2 / n);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")} Z`;
}

function hexagonPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90); // flat-top pointing up
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")} Z`;
}

/** Composite filter applied to the text group (shadow / glow / neon / blur). */
function textFilter(config: FaviconConfig, uid: string): { def: string; ref: string } | null {
  const fx = config.effects;
  if (!fx.textShadow && !fx.glow && !fx.neon && fx.blur <= 0) return null;
  const id = `tfx-${uid}`;
  const parts: string[] = [];
  const merges: string[] = [];

  if (fx.blur > 0) {
    parts.push(`<feGaussianBlur in="SourceGraphic" stdDeviation="${fx.blur}" result="blurred"/>`);
  }
  const source = fx.blur > 0 ? "blurred" : "SourceGraphic";

  if (fx.neon) {
    const glow = config.textGradient.enabled ? config.textGradient.from : config.textColor;
    parts.push(
      `<feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${glow}" flood-opacity="1" in="${source}" result="n1"/>`,
      `<feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${glow}" flood-opacity="0.9" in="${source}" result="n2"/>`,
      `<feDropShadow dx="0" dy="0" stdDeviation="22" flood-color="${glow}" flood-opacity="0.7" in="${source}" result="n3"/>`,
    );
    merges.push("n3", "n2", "n1");
  } else if (fx.glow) {
    const glow = config.textGradient.enabled ? config.textGradient.from : config.textColor;
    parts.push(`<feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="${glow}" flood-opacity="0.85" in="${source}" result="g1"/>`);
    merges.push("g1");
  }
  if (fx.textShadow) {
    parts.push(`<feDropShadow dx="6" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.55" in="${source}" result="sh"/>`);
    merges.push("sh");
  }

  const mergeNodes = [...merges, source].map((m) => `<feMergeNode in="${m}"/>`).join("");
  const def =
    `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">${parts.join("")}` +
    `<feMerge>${mergeNodes}</feMerge></filter>`;
  return { def, ref: `url(#${id})` };
}

/** Composite filter applied to the background shape (drop shadow / glow). */
function shapeFilter(config: FaviconConfig, uid: string): { def: string; ref: string } | null {
  const wantsShadow = config.shadow || config.effects.outerShadow;
  const wantsGlow = config.glow;
  if (!wantsShadow && !wantsGlow) return null;
  const id = `sfx-${uid}`;
  const parts: string[] = [];
  const merges: string[] = [];
  if (wantsGlow) {
    parts.push(`<feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="${config.glowColor}" flood-opacity="0.85" in="SourceGraphic" result="glow"/>`);
    merges.push("glow");
  }
  if (wantsShadow) {
    const sd = config.effects.outerShadow ? 18 : 10;
    parts.push(`<feDropShadow dx="0" dy="${sd / 2}" stdDeviation="${sd}" flood-color="#000000" flood-opacity="0.5" in="SourceGraphic" result="shadow"/>`);
    merges.push("shadow");
  }
  const mergeNodes = [...merges, "SourceGraphic"].map((m) => `<feMergeNode in="${m}"/>`).join("");
  const def = `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">${parts.join("")}<feMerge>${mergeNodes}</feMerge></filter>`;
  return { def, ref: `url(#${id})` };
}

export interface RenderOptions {
  /** when true, emits a standalone document with xmlns (for file export) */
  standalone?: boolean;
}

/** Builds the inner SVG scene (defs + layers) without the wrapping <svg>. */
export function renderScene(config: FaviconConfig, extraFontCss?: string, skipText = false): string {
  const uid = nextUid();
  const defs: string[] = [];

  // ── Background paint ──
  let bgPaint = config.bgColor;
  if (config.bgGradient.enabled) {
    const g = gradientDef(uid, "bg", config.bgGradient);
    defs.push(g.def);
    bgPaint = g.ref;
  }

  // ── Text paint ──
  let textPaint = config.textColor;
  if (!skipText) {
    if (config.effects.metallic) {
      const m = metallicDef(uid, config.textGradient.enabled ? config.textGradient.from : config.textColor);
      defs.push(m.def);
      textPaint = m.ref;
    } else if (config.textGradient.enabled) {
      const g = gradientDef(uid, "text", config.textGradient);
      defs.push(g.def);
      textPaint = g.ref;
    }
  }

  const shape = shapeGeometry(config, uid);
  const sFilter = shapeFilter(config, uid);
  const tFilter = skipText ? null : textFilter(config, uid);
  if (sFilter) defs.push(sFilter.def);
  if (tFilter) defs.push(tFilter.def);
  if (shape) defs.push(shape.clipDef);

  const layers: string[] = [];

  // 1. Background shape (+ border + filter)
  if (shape) {
    const extras: string[] = [];
    if (config.bgOpacity < 1) extras.push(`fill-opacity="${config.bgOpacity}"`);
    if (config.borderWidth > 0) extras.push(`stroke="${config.borderColor}" stroke-width="${config.borderWidth}"`);
    const filterAttr = sFilter ? ` filter="${sFilter.ref}"` : "";
    layers.push(`<g${filterAttr}>${shape.draw(bgPaint, extras.join(" "))}</g>`);
  }

  // 2. Text
  if (!skipText) {
    layers.push(textGroup(config, textPaint, tFilter?.ref ?? null));
  }

  // 3. Glass highlight overlay (clipped to shape)
  if (config.effects.glass && shape) {
    const gid = `glass-${uid}`;
    defs.push(
      `<linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">` +
        `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>` +
        `<stop offset="45%" stop-color="#ffffff" stop-opacity="0.08"/>` +
        `<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>` +
        `</linearGradient>`,
    );
    layers.push(`<g clip-path="url(#${shape.clipId})"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="url(#${gid})"/></g>`);
  }

  // 4. Inner shadow (clipped to shape)
  if (config.effects.innerShadow && shape) {
    const iid = `inner-${uid}`;
    defs.push(
      `<filter id="${iid}"><feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>` +
        `<feGaussianBlur stdDeviation="14"/><feOffset dx="0" dy="6" result="o"/>` +
        `<feFlood flood-color="#000000" flood-opacity="0.55"/><feComposite in2="o" operator="in"/>` +
        `<feComposite in2="SourceGraphic" operator="over"/></filter>`,
    );
    layers.push(
      `<g clip-path="url(#${shape.clipId})"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="#000" fill-opacity="0" filter="url(#${iid})"/></g>`,
    );
  }

  // 5. Noise texture (clipped to shape or full canvas)
  if (config.effects.noise) {
    const nid = `noise-${uid}`;
    defs.push(
      `<filter id="${nid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix type="saturate" values="0"/></filter>`,
    );
    const clip = shape ? ` clip-path="url(#${shape.clipId})"` : "";
    layers.push(`<g${clip}><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" filter="url(#${nid})" opacity="0.12"/></g>`);
  }

  // <style> must be a direct child of <svg>, not inside <defs>, for Chrome to
  // apply @font-face when the SVG is loaded as an <img> from a blob URL.
  const fontCssBlock = (extraFontCss ?? fontFaceCssForId(config.fontFamily));
  const styleTag = fontCssBlock ? `<style>${fontCssBlock}</style>` : "";
  return `${styleTag}<defs>${defs.join("")}</defs>${layers.join("")}`;
}

/**
 * Renders a FaviconConfig to a 512×512 SVG string. The result is ALWAYS
 * namespaced (`xmlns`) so it renders both inline AND as an <img> / data-uri
 * source — without xmlns the browser refuses to draw a data-uri SVG.
 *
 * When font base64 data is available in cache the SVG is self-contained
 * (no external URL needed), so it renders correctly even as a data-uri <img>.
 */
export function renderSVG(config: FaviconConfig, _opts: RenderOptions = {}): string {
  const extraLayers = config.extraLayers?.length ? renderLayers(config.extraLayers) : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" shape-rendering="geometricPrecision">` +
    `${renderScene(config)}${extraLayers}</svg>`
  );
}

/** Builds the positioned, rotated, skewed text element. */
function textGroup(config: FaviconConfig, paint: string, filterRef: string | null): string {
  const text = resolveText(config);
  const pad = config.padding;
  const left = pad;
  const right = CANVAS - pad;
  const top = pad;
  const bottom = CANVAS - pad;

  let anchorX: number;
  let textAnchor: string;
  switch (config.hAlign) {
    case "left": anchorX = left + CANVAS * 0.06; textAnchor = "start"; break;
    case "right": anchorX = right - CANVAS * 0.06; textAnchor = "end"; break;
    default: anchorX = CANVAS / 2; textAnchor = "middle"; break;
  }
  let anchorY: number;
  let baseline: string;
  switch (config.vAlign) {
    case "top": anchorY = top + config.fontSize * 0.5; baseline = "middle"; break;
    case "bottom": anchorY = bottom - config.fontSize * 0.2; baseline = "alphabetic"; break;
    default: anchorY = CANVAS / 2; baseline = "central"; break;
  }

  anchorX += config.offsetX;
  anchorY += config.offsetY;

  const transforms = [
    `translate(${anchorX.toFixed(2)} ${anchorY.toFixed(2)})`,
    config.rotation ? `rotate(${config.rotation})` : "",
    config.italic ? `skewX(${-config.italic})` : "",
  ].filter(Boolean).join(" ");

  const filterAttr = filterRef ? ` filter="${filterRef}"` : "";
  const family = fontFamilyCss(config.fontFamily);

  return (
    `<g transform="${transforms}"${filterAttr}>` +
    `<text x="0" y="0" text-anchor="${textAnchor}" dominant-baseline="${baseline}" ` +
    `font-family="${esc(family)}" font-size="${config.fontSize}" font-weight="${config.fontWeight}" ` +
    `letter-spacing="${config.letterSpacing}" fill="${paint}">${esc(text)}</text>` +
    `</g>`
  );
}

/** Convenience: SVG as a data URI (used for <img> sources & thumbnails). */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─── Export rasterizer support ───────────────────────────────────────────────
// Chrome blocks @font-face in SVG rendered via <img>/blob URL.
// Solution: render SVG without <text>, draw text separately via ctx.fillText()
// using fonts already loaded in document.fonts (Google Fonts <link> in head).

export interface CanvasTextParams {
  text: string;
  x: number;        // absolute px on the 512 canvas
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  rotation: number;   // degrees
  italic: number;     // skewX degrees
  textAnchor: "start" | "middle" | "end";
  baseline: "middle" | "central" | "alphabetic";
  fill: string;                              // solid color or "gradient"
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  metallic: boolean;
  // text effects
  textShadow: boolean;
  glow: boolean;
  neon: boolean;
}

/** Returns the text draw parameters matching what renderScene() would produce. */
export function getTextParams(config: FaviconConfig): CanvasTextParams {
  const text = resolveText(config);
  const pad = config.padding;
  const left = pad;
  const right = CANVAS - pad;
  const top = pad;
  const bottom = CANVAS - pad;

  let anchorX: number;
  let textAnchor: "start" | "middle" | "end";
  switch (config.hAlign) {
    case "left":  anchorX = left + CANVAS * 0.06;  textAnchor = "start"; break;
    case "right": anchorX = right - CANVAS * 0.06; textAnchor = "end";   break;
    default:      anchorX = CANVAS / 2;             textAnchor = "middle"; break;
  }
  let anchorY: number;
  let baseline: "middle" | "central" | "alphabetic";
  switch (config.vAlign) {
    case "top":    anchorY = top + config.fontSize * 0.5;  baseline = "middle";     break;
    case "bottom": anchorY = bottom - config.fontSize * 0.2; baseline = "alphabetic"; break;
    default:       anchorY = CANVAS / 2;                   baseline = "central";    break;
  }

  anchorX += config.offsetX;
  anchorY += config.offsetY;

  const family = fontFamilyCss(config.fontFamily);
  const fx = config.effects;

  return {
    text,
    x: anchorX,
    y: anchorY,
    fontFamily: family,
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    letterSpacing: config.letterSpacing,
    rotation: config.rotation,
    italic: config.italic,
    textAnchor,
    baseline,
    fill: config.textColor,
    gradientEnabled: config.textGradient.enabled,
    gradientFrom: config.textGradient.from,
    gradientTo: config.textGradient.to,
    gradientAngle: config.textGradient.angle,
    metallic: fx.metallic,
    textShadow: fx.textShadow,
    glow: fx.glow,
    neon: fx.neon,
  };
}

/** SVG without the text layer — used by the export rasterizer so text can be
 *  drawn separately via ctx.fillText() with document.fonts. */
export function renderSVGNoText(config: FaviconConfig): string {
  const uid = nextUid();
  const defs: string[] = [];

  let bgPaint = config.bgColor;
  if (config.bgGradient.enabled) {
    const g = gradientDef(uid, "bg", config.bgGradient);
    defs.push(g.def);
    bgPaint = g.ref;
  }

  const shape = shapeGeometry(config, uid);
  const sFilter = shapeFilter(config, uid);
  if (sFilter) defs.push(sFilter.def);
  if (shape)   defs.push(shape.clipDef);

  const layers: string[] = [];

  if (shape) {
    const extras: string[] = [];
    if (config.bgOpacity < 1) extras.push(`fill-opacity="${config.bgOpacity}"`);
    if (config.borderWidth > 0) extras.push(`stroke="${config.borderColor}" stroke-width="${config.borderWidth}"`);
    const filterAttr = sFilter ? ` filter="${sFilter.ref}"` : "";
    layers.push(`<g${filterAttr}>${shape.draw(bgPaint, extras.join(" "))}</g>`);
  }

  if (config.effects.glass && shape) {
    const gid = `glass-${uid}`;
    defs.push(
      `<linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">` +
        `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>` +
        `<stop offset="45%" stop-color="#ffffff" stop-opacity="0.08"/>` +
        `<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>` +
        `</linearGradient>`,
    );
    layers.push(`<g clip-path="url(#${shape.clipId})"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="url(#${gid})"/></g>`);
  }

  if (config.effects.innerShadow && shape) {
    const iid = `inner-${uid}`;
    defs.push(
      `<filter id="${iid}"><feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>` +
        `<feGaussianBlur stdDeviation="14"/><feOffset dx="0" dy="6" result="o"/>` +
        `<feFlood flood-color="#000000" flood-opacity="0.55"/><feComposite in2="o" operator="in"/>` +
        `<feComposite in2="SourceGraphic" operator="over"/></filter>`,
    );
    layers.push(
      `<g clip-path="url(#${shape.clipId})"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="#000" fill-opacity="0" filter="url(#${iid})"/></g>`,
    );
  }

  if (config.effects.noise) {
    const nid = `noise-${uid}`;
    defs.push(
      `<filter id="${nid}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix type="saturate" values="0"/></filter>`,
    );
    const clip = shape ? ` clip-path="url(#${shape.clipId})"` : "";
    layers.push(`<g${clip}><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" filter="url(#${nid})" opacity="0.12"/></g>`);
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" width="${CANVAS}" height="${CANVAS}" shape-rendering="geometricPrecision">` +
    `<defs>${defs.join("")}</defs>${layers.join("")}</svg>`
  );
}
