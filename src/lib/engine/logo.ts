import type { FaviconConfig, LogoLayout } from "@/lib/types";
import { renderScene } from "@/lib/engine/render";
import { fontFamilyCss, fontFaceCssForId } from "@/lib/engine/fonts";
import { resolveText } from "@/lib/engine/defaults";
import { gradientVector } from "@/lib/engine/colors";
import { renderLayers } from "@/lib/engine/layers";

/**
 * Logo engine — turns a favicon design into a full logo lockup
 * (icon + wordmark). Reuses the exact favicon scene as a nested <svg>,
 * so the icon stays pixel-identical to the favicon, and adds the brand
 * wordmark beside or beneath it.
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface LogoSize {
  width: number;
  height: number;
}

/** Default canvas per layout. Square (stacked) is the 512×512 export logo. */
export function logoSize(layout: LogoLayout): LogoSize {
  return layout === "stacked" ? { width: 512, height: 512 } : { width: 1024, height: 320 };
}

export interface LogoIconInfo {
  x: number;
  y: number;
  size: number;
  svgWidth: number;
  svgHeight: number;
}

/** Returns the position/size of the favicon icon within the logo canvas. */
export function getLogoIconInfo(config: FaviconConfig, size?: LogoSize): LogoIconInfo | null {
  const lg = config.logo;
  if (!lg || lg.showFaviconIcon === false) return null;

  const { width: W, height: H } = size ?? logoSize(lg.layout);
  const pad = Math.round(Math.min(W, H) * 0.08);

  const word = (lg.wordmarkText || "").trim() || config.brandName.trim() || "";
  const showWord = lg.showWordmark && word.length > 0;

  let iconSize: number;
  let iconX: number;
  let iconY: number;

  if (lg.layout === "stacked" || !showWord) {
    iconSize = showWord ? Math.min(W - pad * 2, H * 0.6) : Math.min(W, H) - pad * 2;
    iconX = (W - iconSize) / 2;
    iconY = showWord ? pad : (H - iconSize) / 2;
  } else {
    iconSize = H - pad * 2;
    iconX = pad;
    iconY = pad;
  }

  return { x: iconX, y: iconY, size: iconSize, svgWidth: W, svgHeight: H };
}

function wordmarkOf(config: FaviconConfig): string {
  const lg = config.logo;
  const raw = (lg.wordmarkText || "").trim() || config.brandName.trim() || resolveText(config);
  return config.autoUppercase ? raw.toUpperCase() : raw;
}

/**
 * Renders the logo to an SVG string. `size` overrides the canvas (the export
 * pipeline always asks for the natural size for the chosen layout).
 */
export function renderLogoSVG(config: FaviconConfig, size?: LogoSize, skipFaviconText = false): string {
  const lg = config.logo ?? {
    layout: "horizontal" as LogoLayout,
    showFaviconIcon: true,
    showWordmark: true,
    wordmarkText: "",
    wordmarkColor: "#fff",
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
  };
  const showIcon = lg.showFaviconIcon !== false;
  const { width: W, height: H } = size ?? logoSize(lg.layout);
  const pad = Math.round(Math.min(W, H) * 0.08);

  const word = wordmarkOf(config);
  const showWord = lg.showWordmark && word.length > 0;

  const wmFontId = lg.wordmarkFont || config.fontFamily;
  const family = fontFamilyCss(wmFontId);
  const wmWeight = lg.wordmarkWeight ?? config.fontWeight;
  const wmLetterSpacing = lg.wordmarkLetterSpacing ?? 0;
  const wmItalic = lg.wordmarkItalic ?? 0;
  const wmGradient = lg.wordmarkGradient ?? { enabled: false, from: "#ffffff", to: "#e63946", angle: 90 };

  // Inline wordmark font CSS in the outer SVG defs.
  // The favicon icon font is embedded inside the nested <svg> via renderScene().
  const fontCss = fontFaceCssForId(wmFontId);

  const uid = `logo-${Math.random().toString(36).slice(2, 7)}`;
  const defs: string[] = [];
  // <style> is placed as a direct child of the root <svg> (not inside <defs>)
  // so Chrome applies @font-face when the SVG is rendered via blob URL <img>.
  const wmStyleTag = fontCss ? `<style>${fontCss}</style>` : "";

  // Wordmark fill — gradient or solid
  let wmFill = lg.wordmarkColor;
  if (wmGradient.enabled) {
    const id = `wmg-${uid}`;
    const v = gradientVector(wmGradient.angle);
    defs.push(
      `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">` +
        `<stop offset="0%" stop-color="${wmGradient.from}"/>` +
        `<stop offset="100%" stop-color="${wmGradient.to}"/>` +
        `</linearGradient>`,
    );
    wmFill = `url(#${id})`;
  }

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="geometricPrecision">`,
  );
  // <style> must be a direct child of <svg> for Chrome to apply @font-face via blob URL
  if (wmStyleTag) parts.push(wmStyleTag);
  if (defs.length) parts.push(`<defs>${defs.join("")}</defs>`);

  if (lg.bgEnabled) {
    parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${lg.bgColor}"/>`);
  }

  // Geometry per layout.
  let iconSize: number;
  let iconX: number;
  let iconY: number;
  let wmX = 0;
  let wmY = 0;
  let wmAnchor: "start" | "middle" = "start";
  let wmMaxWidth = 0;

  if (lg.layout === "stacked" || !showWord) {
    iconSize = showIcon && showWord ? Math.min(W - pad * 2, H * 0.6) : Math.min(W, H) - pad * 2;
    iconX = (W - iconSize) / 2;
    iconY = showIcon && showWord ? pad : (H - iconSize) / 2;
    wmAnchor = "middle";
    wmX = W / 2;
    wmY = showIcon ? (iconY + iconSize + (H - (iconY + iconSize)) / 2) : H / 2;
    wmMaxWidth = W - pad * 2;
  } else {
    iconSize = H - pad * 2;
    iconX = pad;
    iconY = pad;
    wmAnchor = "start";
    wmX = showIcon ? (iconX + iconSize + pad) : pad;
    wmY = H / 2;
    wmMaxWidth = showIcon ? (W - wmX - pad) : (W - pad * 2);
  }

  // Nested favicon icon (optional layer)
  if (showIcon) {
    parts.push(
      `<svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="0 0 512 512" overflow="visible">${renderScene(config, undefined, skipFaviconText)}</svg>`,
    );
  }

  // Wordmark text
  if (showWord) {
    let fontSize: number;
    if (lg.wordmarkSize && lg.wordmarkSize > 0) {
      fontSize = lg.wordmarkSize;
    } else {
      const maxByHeight = lg.layout === "stacked" ? (H - (showIcon ? iconY + iconSize : 0)) * 0.55 : H * 0.42;
      const fitWidth = wmMaxWidth / Math.max(1, word.length * 0.62);
      fontSize = Math.max(24, Math.min(maxByHeight, fitWidth, 220));
    }

    const wmOffX = lg.wordmarkOffsetX ?? 0;
    const wmOffY = lg.wordmarkOffsetY ?? 0;
    const skewAttr = wmItalic ? ` transform="skewX(${-wmItalic})"` : "";
    parts.push(
      `<text data-role="wordmark" x="${(wmX + wmOffX).toFixed(1)}" y="${(wmY + wmOffY).toFixed(1)}" text-anchor="${wmAnchor}" dominant-baseline="central"${skewAttr} ` +
        `font-family="${esc(family)}" font-size="${fontSize.toFixed(1)}" font-weight="${wmWeight}" ` +
        `letter-spacing="${wmLetterSpacing}" fill="${wmFill}">${esc(word)}</text>`,
    );
  }

  // Extra design layers on top
  if (lg.extraLayers?.length) {
    parts.push(renderLayers(lg.extraLayers));
  }

  parts.push(`</svg>`);
  return parts.join("");
}
