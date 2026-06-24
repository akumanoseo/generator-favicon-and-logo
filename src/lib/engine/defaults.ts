import type { FaviconConfig } from "@/lib/types";

/** Factory default configuration for a fresh favicon. */
export function defaultConfig(): FaviconConfig {
  return {
    brandName: "Akuma",
    text: "",
    autoUppercase: true,

    fontFamily: "anton",
    fontSize: 240,
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1,
    rotation: 0,
    italic: 0,
    offsetX: 0,
    offsetY: 0,
    hAlign: "center",
    vAlign: "middle",

    textColor: "#ffffff",
    textGradient: { enabled: false, from: "#ffffff", to: "#e63946", angle: 90 },

    shape: "rounded",
    cornerRadius: 96,
    padding: 0,
    bgColor: "#e63946",
    bgOpacity: 1,
    bgGradient: { enabled: false, from: "#e63946", to: "#7209b7", angle: 135 },
    borderWidth: 0,
    borderColor: "#ffffff",
    shadow: false,
    glow: false,
    glowColor: "#e63946",

    effects: {
      textShadow: false,
      glow: false,
      neon: false,
      blur: 0,
      innerShadow: false,
      outerShadow: false,
      metallic: false,
      glass: false,
      noise: false,
    },

    logo: {
      layout: "horizontal",
      showFaviconIcon: true,
      showWordmark: true,
      wordmarkText: "",
      wordmarkColor: "#ffffff",
      wordmarkFont: "",
      wordmarkSize: 0,
      wordmarkWeight: 700,
      wordmarkLetterSpacing: 0,
      wordmarkItalic: 0,
      wordmarkOffsetX: 0,
      wordmarkOffsetY: 0,
      wordmarkGradient: { enabled: false, from: "#ffffff", to: "#e63946", angle: 90 },
      bgEnabled: false,
      bgColor: "#0a0a0a",
      extraLayers: [],
    },
    extraLayers: [],
  };
}

/**
 * Resolves the text actually drawn on the favicon.
 * Empty text falls back to the first 1–2 characters of the brand name.
 */
export function resolveText(config: FaviconConfig): string {
  let raw = config.text.trim();
  if (!raw) {
    const cleaned = config.brandName.trim().replace(/[^\p{L}\p{N}]/gu, "");
    raw = cleaned.slice(0, cleaned.length <= 4 ? Math.min(2, cleaned.length) : 2) || "A";
  }
  return config.autoUppercase ? raw.toUpperCase() : raw;
}

/**
 * Merges a (possibly partial / older) config onto the current defaults so new
 * fields like `logo` are always present when loading old projects/autosaves.
 */
export function withDefaults(partial: Partial<FaviconConfig> | undefined | null): FaviconConfig {
  const d = defaultConfig();
  if (!partial) return d;
  return {
    ...d,
    ...partial,
    textGradient: { ...d.textGradient, ...(partial.textGradient ?? {}) },
    bgGradient: { ...d.bgGradient, ...(partial.bgGradient ?? {}) },
    effects: { ...d.effects, ...(partial.effects ?? {}) },
    logo: {
      ...d.logo,
      ...(partial.logo ?? {}),
      wordmarkOffsetX: partial.logo?.wordmarkOffsetX ?? d.logo.wordmarkOffsetX,
      wordmarkOffsetY: partial.logo?.wordmarkOffsetY ?? d.logo.wordmarkOffsetY,
      extraLayers: partial.logo?.extraLayers ?? d.logo.extraLayers,
    },
    extraLayers: partial.extraLayers ?? d.extraLayers,
  };
}

/** Deep clone of a config (structuredClone with a JSON fallback). */
export function cloneConfig(c: FaviconConfig): FaviconConfig {
  if (typeof structuredClone === "function") return structuredClone(c);
  return JSON.parse(JSON.stringify(c));
}
