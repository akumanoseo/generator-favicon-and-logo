/** Color system — predefined palette, parsing, contrast and gradient helpers. */

export const PALETTE: string[] = [
  "#1a1a2e",
  "#e63946",
  "#2d6a4f",
  "#457b9d",
  "#f4a261",
  "#9b5de5",
  "#06d6a0",
  "#118ab2",
  "#ffd166",
  "#ef476f",
  "#073b4c",
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f77f00",
  "#4361ee",
  "#3a0ca3",
  "#7209b7",
  "#333333",
  "#ffffff",
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Relative luminance (0 dark → 1 light). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Picks black or white text for best contrast on a background. */
export function readableTextColor(bg: string): string {
  return luminance(bg) > 0.45 ? "#0a0a0a" : "#ffffff";
}

/** WCAG-ish contrast ratio between two colors. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amount, g: g + (255 - g) * amount, b: b + (255 - b) * amount });
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amount), g: g * (1 - amount), b: b * (1 - amount) });
}

/** Hue bucket 0..11 — used by the uniqueness engine to compare colors. */
export function hueBucket(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d < 0.04) return max < 0.2 ? 12 : max > 0.85 ? 13 : 14; // near-grayscale buckets
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return Math.floor(h / 30); // 0..11
}

/** SVG gradient coordinate pair from an angle in degrees. */
export function gradientVector(angle: number): { x1: string; y1: string; x2: string; y2: string } {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  // map -1..1 to 0..1 endpoints
  return {
    x1: `${(0.5 - x / 2) * 100}%`,
    y1: `${(0.5 - y / 2) * 100}%`,
    x2: `${(0.5 + x / 2) * 100}%`,
    y2: `${(0.5 + y / 2) * 100}%`,
  };
}

export function isValidHex(s: string): boolean {
  return /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s.trim());
}

export function normalizeHex(s: string): string {
  let h = s.trim();
  if (!h.startsWith("#")) h = "#" + h;
  if (h.length === 4) h = "#" + h.slice(1).split("").map((c) => c + c).join("");
  return h.toLowerCase();
}
