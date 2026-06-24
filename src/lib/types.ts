/**
 * Core type definitions for the favicon factory.
 * A `FaviconConfig` is the single source of truth that flows through:
 *   render engine (SVG) → editor → preview → rasterizer → export.
 */

export type ShapeKind =
  | "square"
  | "rounded"
  | "circle"
  | "squircle"
  | "hexagon"
  | "none";

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

export interface GradientConfig {
  enabled: boolean;
  from: string;
  to: string;
  /** degrees, 0 = left→right, 90 = top→bottom */
  angle: number;
}

export type LogoLayout = "horizontal" | "stacked";

// ── Design Layer system ──────────────────────────────────────────────────────

export type LayerKind = "text" | "shape" | "icon";

interface LayerBase {
  id: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface TextDesignLayer extends LayerBase {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  gradient: GradientConfig;
  letterSpacing: number;
  italic: number;
  align: "left" | "center" | "right";
}

export type ShapeLayerKind =
  | "rect" | "circle" | "triangle" | "hexagon"
  | "diamond" | "star" | "line" | "cross" | "pill";

export interface ShapeDesignLayer extends LayerBase {
  kind: "shape";
  shapeType: ShapeLayerKind;
  fill: string;
  fillGradient: GradientConfig;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface IconDesignLayer extends LayerBase {
  kind: "icon";
  iconId: string;
  fill: string;
  fillGradient: GradientConfig;
  stroke: string;
  strokeWidth: number;
}

export type DesignLayer = TextDesignLayer | ShapeDesignLayer | IconDesignLayer;

// ── Logo config ──────────────────────────────────────────────────────────────

/** Logo lockup settings — turns the favicon icon into a full logo. */
export interface LogoConfig {
  layout: LogoLayout;
  showFaviconIcon: boolean;
  showWordmark: boolean;
  /** wordmark text; empty → brand name */
  wordmarkText: string;
  wordmarkColor: string;
  /** font id for the wordmark; empty → same as favicon font */
  wordmarkFont: string;
  /** font size override in px; 0 = auto-fit */
  wordmarkSize: number;
  wordmarkWeight: number;
  wordmarkLetterSpacing: number;
  wordmarkItalic: number;
  /** manual offset in logo canvas px; 0 = auto-positioned */
  wordmarkOffsetX: number;
  wordmarkOffsetY: number;
  wordmarkGradient: GradientConfig;
  bgEnabled: boolean;
  bgColor: string;
  /** extra design layers rendered on top of the logo */
  extraLayers: DesignLayer[];
}

export interface EffectConfig {
  textShadow: boolean;
  glow: boolean; // text glow
  neon: boolean;
  blur: number; // px (0 = off)
  innerShadow: boolean;
  outerShadow: boolean;
  metallic: boolean;
  glass: boolean;
  noise: boolean;
}

export interface FaviconConfig {
  // ── Brand ──
  brandName: string;
  /** explicit favicon text; if empty, derived from brand name */
  text: string;
  autoUppercase: boolean;

  // ── Typography ──
  fontFamily: string; // FontDef.id
  fontSize: number; // px on the 512 canvas
  fontWeight: number;
  letterSpacing: number; // px
  lineHeight: number; // multiplier
  rotation: number; // degrees
  italic: number; // skew angle degrees
  offsetX: number; // px from center, -256..256
  offsetY: number;
  hAlign: HAlign;
  vAlign: VAlign;

  // ── Text color ──
  textColor: string;
  textGradient: GradientConfig;

  // ── Background ──
  shape: ShapeKind;
  cornerRadius: number; // px (rounded shape)
  padding: number; // px inset for the shape
  bgColor: string;
  bgOpacity: number; // 0..1
  bgGradient: GradientConfig;
  borderWidth: number;
  borderColor: string;
  shadow: boolean; // shape drop shadow
  glow: boolean; // shape glow
  glowColor: string;

  // ── Effects ──
  effects: EffectConfig;

  // ── Logo lockup ──
  logo: LogoConfig;

  // ── Extra design layers (favicon mode) ──
  extraLayers: DesignLayer[];
}

/** A single item in the batch queue / bulk output. */
export interface BatchItem {
  id: string;
  config: FaviconConfig;
  /** whether this item is a favicon or a logo lockup */
  mode: "favicon" | "logo";
  /** cached SVG markup for fast list rendering */
  svg: string;
  createdAt: number;
  /** uniqueness signature, computed at insert time */
  signature: string;
  selected?: boolean;
}

export interface FontDef {
  id: string;
  name: string;
  /** css font-family value */
  family: string;
  /** google fonts "family:wght" spec, e.g. "Bebas+Neue" */
  googleSpec: string;
  /** weights available for the google request */
  weights: number[];
  category: "display" | "sans" | "serif";
}

export interface ColorSwatch {
  hex: string;
  name?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  /** partial config applied on top of defaults */
  apply: Partial<FaviconConfig>;
  /** pools the bulk generator may draw from for this vibe */
  palette: string[];
  fonts: string[];
  shapes: ShapeKind[];
}

export interface ProjectState {
  editor: FaviconConfig;
  batch: BatchItem[];
  recentColors: string[];
  name: string;
  updatedAt: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnail: string | null;
  updatedAt: string;
  createdAt: string;
  faviconCount?: number;
}

/** Sizes exported per brand. */
export const EXPORT_SIZES = [16, 32, 48, 64, 180, 192, 512] as const;
export type ExportSize = (typeof EXPORT_SIZES)[number];

/** Logical canvas size all geometry is authored against. */
export const CANVAS = 512;
