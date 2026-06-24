import type { FaviconConfig, LogoConfig, ShapeKind, GradientConfig } from "@/lib/types";
import { FONTS } from "@/lib/engine/fonts";
import { PALETTE, readableTextColor, contrastRatio } from "@/lib/engine/colors";
import { defaultConfig } from "@/lib/engine/defaults";

/**
 * Seeded PRNG (mulberry32). Deterministic given a seed — lets the bulk
 * generator reproduce a run and lets the uniqueness engine search the
 * combination space predictably.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}

// ── Random brand-name generator (iGaming flavored) ──
const PREFIXES = ["Stake", "Bet", "Spin", "Velo", "Luck", "AZur", "Roya", "Gold", "Neon", "Volt", "Mega", "Fortu", "Casi", "Wild", "Vega", "Turbo", "Jack", "Lion", "Drago", "Cobra"];
const SUFFIXES = ["go", "oro", "ix", "bet", "win", "spin", "play", "zo", "ra", "io", "ly", "fy", "nova", "max", "pro", "vegas", "777", "land", "club", "x"];

export function randomBrandName(rng: () => number = Math.random): string {
  const a = pick(rng, PREFIXES);
  const b = pick(rng, SUFFIXES);
  return a + b;
}

export interface RandomizeOptions {
  /** restrict to these pools (preset-driven), else use defaults */
  palette?: string[];
  fonts?: string[];
  shapes?: ShapeKind[];
  /** keep brand/text fields from the base config */
  keepBrand?: boolean;
}

const ALL_SHAPES: ShapeKind[] = ["square", "rounded", "circle", "squircle", "hexagon"];

/**
 * Produces a fully randomized but *coherent* config: a readable color pair,
 * a sensible font size, and a curated mix of effects (never all at once).
 */
export function randomizeConfig(base: FaviconConfig, seed: number, opts: RandomizeOptions = {}): FaviconConfig {
  const rng = makeRng(seed);
  const palette = opts.palette?.length ? opts.palette : PALETTE;
  const fontPool = opts.fonts?.length ? opts.fonts : FONTS.map((f) => f.id);
  const shapePool = opts.shapes?.length ? opts.shapes : ALL_SHAPES;

  const c = { ...base };

  // Background color — ensure it differs from white-on-white situations.
  const bg = pick(rng, palette);
  c.bgColor = bg;
  c.bgOpacity = 1;

  // Text color: prefer a palette color with good contrast, else auto.
  let textColor = readableTextColor(bg);
  for (let i = 0; i < 6; i++) {
    const cand = pick(rng, palette);
    if (contrastRatio(cand, bg) >= 3.5) {
      textColor = cand;
      break;
    }
  }
  c.textColor = textColor;

  // Background gradient (40%).
  if (chance(rng, 0.4)) {
    let to = pick(rng, palette);
    if (to === bg) to = pick(rng, palette);
    c.bgGradient = { enabled: true, from: bg, to, angle: Math.round(range(rng, 0, 360)) };
  } else {
    c.bgGradient = { ...base.bgGradient, enabled: false };
  }

  // Text gradient (25%).
  if (chance(rng, 0.25)) {
    c.textGradient = { enabled: true, from: textColor, to: pick(rng, palette), angle: Math.round(range(rng, 0, 360)) };
  } else {
    c.textGradient = { ...base.textGradient, enabled: false, from: textColor };
  }

  // Shape.
  c.shape = pick(rng, shapePool);
  c.cornerRadius = Math.round(range(rng, 40, 160));
  c.padding = chance(rng, 0.3) ? Math.round(range(rng, 8, 40)) : 0;
  c.borderWidth = chance(rng, 0.25) ? Math.round(range(rng, 6, 22)) : 0;
  c.borderColor = pick(rng, palette);

  // Typography.
  c.fontFamily = pick(rng, fontPool);
  c.fontWeight = pick(rng, [400, 600, 700, 800, 900]);
  c.fontSize = Math.round(range(rng, 190, 300));
  c.letterSpacing = Math.round(range(rng, -8, 14));
  c.rotation = chance(rng, 0.18) ? Math.round(range(rng, -12, 12)) : 0;
  c.italic = chance(rng, 0.18) ? Math.round(range(rng, 0, 16)) : 0;
  c.offsetX = chance(rng, 0.25) ? Math.round(range(rng, -30, 30)) : 0;
  c.offsetY = chance(rng, 0.25) ? Math.round(range(rng, -30, 30)) : 0;
  c.hAlign = "center";
  c.vAlign = "middle";

  // Effects — pick at most two, weighted, so output stays clean.
  const fx = { textShadow: false, glow: false, neon: false, blur: 0, innerShadow: false, outerShadow: false, metallic: false, glass: false, noise: false };
  const fxKeys: (keyof typeof fx)[] = ["textShadow", "glow", "neon", "innerShadow", "outerShadow", "metallic", "glass", "noise"];
  const count = chance(rng, 0.55) ? (chance(rng, 0.4) ? 2 : 1) : 0;
  const chosen = new Set<keyof typeof fx>();
  while (chosen.size < count) chosen.add(pick(rng, fxKeys));
  for (const k of chosen) (fx as Record<string, boolean | number>)[k] = true;
  // neon and glow are redundant together → keep only neon
  if (fx.neon) fx.glow = false;
  c.effects = fx;

  c.glow = chance(rng, 0.15);
  c.glowColor = bg;
  c.shadow = chance(rng, 0.3);

  return c;
}

/** Randomizes the logo-specific fields (wordmark) while keeping layout choice. */
export function randomizeLogoConfig(base: LogoConfig, seed: number): LogoConfig {
  const rng = makeRng(seed ^ 0xdeadbeef);
  const palette = PALETTE;
  const fontPool = FONTS.map((f) => f.id);

  const wordmarkColor = pick(rng, palette);
  const useGradient = chance(rng, 0.35);
  let to = pick(rng, palette);
  if (to === wordmarkColor) to = pick(rng, palette);

  const wordmarkGradient: GradientConfig = {
    enabled: useGradient,
    from: wordmarkColor,
    to,
    angle: Math.round(range(rng, 0, 360)),
  };

  return {
    ...base,
    showWordmark: true,
    wordmarkFont: pick(rng, fontPool),
    wordmarkColor: useGradient ? base.wordmarkColor : wordmarkColor,
    wordmarkGradient,
    wordmarkWeight: pick(rng, [400, 600, 700, 800, 900]),
    wordmarkSize: 0,
    wordmarkLetterSpacing: Math.round(range(rng, -4, 20)),
    wordmarkItalic: chance(rng, 0.2) ? Math.round(range(rng, 4, 16)) : 0,
  };
}
