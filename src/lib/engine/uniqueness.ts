import type { FaviconConfig } from "@/lib/types";
import { hueBucket } from "@/lib/engine/colors";
import { randomizeConfig, hashString, type RandomizeOptions } from "@/lib/engine/random";

/**
 * Uniqueness / anti-similarity engine.
 *
 * Two responsibilities:
 *  1. Score how visually distinct a config is from a set of existing ones.
 *  2. Drive the bulk generator toward maximum visual diversity by sampling
 *     many candidate seeds per brand and keeping the most distinct one,
 *     while avoiding repeated fonts/colors in immediate succession.
 */

export interface Signature {
  font: string;
  shape: string;
  bgHue: number;
  textHue: number;
  bgGrad: boolean;
  textGrad: boolean;
  layout: string; // align + rotation bucket
}

export function computeSignature(c: FaviconConfig): Signature {
  return {
    font: c.fontFamily,
    shape: c.shape,
    bgHue: hueBucket(c.bgColor),
    textHue: hueBucket(c.textColor),
    bgGrad: c.bgGradient.enabled,
    textGrad: c.textGradient.enabled,
    layout: `${c.hAlign}-${c.vAlign}-${c.rotation !== 0 ? "r" : "s"}`,
  };
}

/** Compact, comparable signature string (also persisted to the DB). */
export function signatureString(c: FaviconConfig): string {
  const s = computeSignature(c);
  return [s.font, s.shape, s.bgHue, s.textHue, s.bgGrad ? 1 : 0, s.textGrad ? 1 : 0, s.layout].join("|");
}

/** Weighted similarity between two configs in 0..1 (1 = identical look). */
export function similarity(a: FaviconConfig, b: FaviconConfig): number {
  const sa = computeSignature(a);
  const sb = computeSignature(b);
  let score = 0;
  let total = 0;
  const add = (w: number, equal: boolean) => {
    total += w;
    if (equal) score += w;
  };
  add(0.28, sa.font === sb.font);
  add(0.22, sa.shape === sb.shape);
  add(0.22, hueDistanceClose(sa.bgHue, sb.bgHue));
  add(0.14, hueDistanceClose(sa.textHue, sb.textHue));
  add(0.07, sa.bgGrad === sb.bgGrad);
  add(0.07, sa.layout === sb.layout);
  return score / total;
}

function hueDistanceClose(a: number, b: number): boolean {
  if (a >= 12 || b >= 12) return a === b; // grayscale buckets only match exactly
  const d = Math.abs(a - b);
  return Math.min(d, 12 - d) <= 1;
}

/** 0..100 — how unique `c` is versus an existing set (100 = totally novel). */
export function uniquenessScore(c: FaviconConfig, existing: FaviconConfig[]): number {
  if (existing.length === 0) return 100;
  let maxSim = 0;
  for (const e of existing) {
    const s = similarity(c, e);
    if (s > maxSim) maxSim = s;
    if (maxSim >= 0.999) break;
  }
  return Math.round((1 - maxSim) * 100);
}

/** 0..100 average distinctness of an entire collection. */
export function collectionDiversity(items: FaviconConfig[]): number {
  if (items.length < 2) return 100;
  let sum = 0;
  let count = 0;
  // Sample pairs to stay O(n) on large sets.
  const step = items.length > 120 ? Math.ceil(items.length / 120) : 1;
  for (let i = 0; i < items.length; i += step) {
    let nearest = 1;
    for (let j = 0; j < items.length; j += step) {
      if (i === j) continue;
      const s = similarity(items[i], items[j]);
      if (s < nearest) nearest = s;
    }
    sum += 1 - nearest;
    count++;
  }
  return Math.round((sum / Math.max(1, count)) * 100);
}

export interface DiverseOptions extends RandomizeOptions {
  /** how many candidate seeds to evaluate per brand */
  candidates?: number;
  /** previously generated configs to also stay distinct from */
  existing?: FaviconConfig[];
}

/**
 * Generates a maximally-diverse batch of configs for the given brand names.
 * For each brand it samples `candidates` randomized variants and keeps the
 * one least similar to everything generated so far, with penalties for
 * reusing the previous font or background hue (avoids visual runs).
 */
export function generateDiverseBatch(
  base: FaviconConfig,
  brands: string[],
  opts: DiverseOptions = {},
): FaviconConfig[] {
  const candidates = opts.candidates ?? 28;
  const accumulated: FaviconConfig[] = [...(opts.existing ?? [])];
  const result: FaviconConfig[] = [];
  let prevFont: string | null = null;
  let prevBgHue: number | null = null;

  brands.forEach((brand, index) => {
    const brandSeed = hashString(`${brand}#${index}`);
    let best: FaviconConfig | null = null;
    let bestScore = -Infinity;

    for (let k = 0; k < candidates; k++) {
      const cfg = randomizeConfig(
        { ...base, brandName: brand, text: "" },
        (brandSeed + k * 2654435761) >>> 0,
        opts,
      );

      // Distinctness from everything so far (higher = better).
      let nearest = 1;
      for (const e of accumulated) {
        const s = similarity(cfg, e);
        if (s < nearest) nearest = s;
        if (nearest <= 0.001) break;
      }
      let score = nearest;

      // Penalize consecutive font / background-hue repeats.
      if (prevFont && cfg.fontFamily === prevFont) score -= 0.25;
      const bh = hueBucket(cfg.bgColor);
      if (prevBgHue !== null && bh === prevBgHue) score -= 0.15;

      if (score > bestScore) {
        bestScore = score;
        best = cfg;
      }
    }

    const chosen = best ?? randomizeConfig({ ...base, brandName: brand }, brandSeed, opts);
    result.push(chosen);
    accumulated.push(chosen);
    prevFont = chosen.fontFamily;
    prevBgHue = hueBucket(chosen.bgColor);
  });

  return result;
}
