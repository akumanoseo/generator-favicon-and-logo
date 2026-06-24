import type { DesignLayer, TextDesignLayer, ShapeDesignLayer, IconDesignLayer } from "@/lib/types";
import { fontFamilyCss } from "@/lib/engine/fonts";
import { gradientVector } from "@/lib/engine/colors";
import { ICON_BY_ID } from "@/lib/engine/icons";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let _uid = 0;
function nextUid() { return `l${(++_uid).toString(36)}`; }

// ── Shape path helpers ──────────────────────────────────────────────────────

function shapePath(shape: ShapeDesignLayer["shapeType"], w: number, h: number, r: number): string {
  const x = 0, y = 0;
  switch (shape) {
    case "rect": {
      const cr = Math.min(r, w / 2, h / 2);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${cr}" ry="${cr}"/>`;
    }
    case "circle":
      return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`;
    case "triangle": {
      const pts = `${w / 2},${y} ${w},${y + h} ${x},${y + h}`;
      return `<polygon points="${pts}"/>`;
    }
    case "hexagon": {
      const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
      const pts = [0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return `${(cx + rx * Math.cos(rad)).toFixed(1)},${(cy + ry * Math.sin(rad)).toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${pts}"/>`;
    }
    case "diamond": {
      const pts = `${w / 2},${y} ${w},${y + h / 2} ${w / 2},${y + h} ${x},${y + h / 2}`;
      return `<polygon points="${pts}"/>`;
    }
    case "star": {
      const cx = w / 2, cy = h / 2;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const ang = (i * 36 - 90) * Math.PI / 180;
        const r2 = i % 2 === 0 ? 0.5 : 0.22;
        pts.push(`${(cx + w * r2 * Math.cos(ang)).toFixed(1)},${(cy + h * r2 * Math.sin(ang)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(" ")}"/>`;
    }
    case "line":
      return `<rect x="${x}" y="${y + h / 2 - h * 0.08}" width="${w}" height="${h * 0.16}" rx="${h * 0.08}"/>`;
    case "cross": {
      const t = Math.min(w, h) * 0.22;
      return (
        `<rect x="${x}" y="${y + (h - t) / 2}" width="${w}" height="${t}" rx="${t / 2}"/>` +
        `<rect x="${x + (w - t) / 2}" y="${y}" width="${t}" height="${h}" rx="${t / 2}"/>`
      );
    }
    case "pill": {
      const pr = Math.min(w, h) / 2;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${pr}" ry="${pr}"/>`;
    }
    default:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  }
}

// ── Layer renderers ─────────────────────────────────────────────────────────

function renderTextLayer(layer: TextDesignLayer): string {
  const uid = nextUid();
  const family = fontFamilyCss(layer.fontFamily || "inter");
  const defs: string[] = [];

  let fill = layer.color;
  if (layer.gradient?.enabled) {
    const id = `tg-${uid}`;
    const v = gradientVector(layer.gradient.angle);
    defs.push(
      `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">` +
      `<stop offset="0%" stop-color="${layer.gradient.from}"/>` +
      `<stop offset="100%" stop-color="${layer.gradient.to}"/>` +
      `</linearGradient>`,
    );
    fill = `url(#${id})`;
  }

  const skew = layer.italic ? ` transform="skewX(${-layer.italic})"` : "";
  const anchor = layer.align === "left" ? "start" : layer.align === "right" ? "end" : "middle";
  const tx = layer.align === "left" ? 0 : layer.align === "right" ? layer.width : layer.width / 2;

  return (
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    `<g transform="translate(${layer.x},${layer.y}) rotate(${layer.rotation},${layer.width / 2},${layer.fontSize / 2})" opacity="${layer.opacity}">` +
    `<text x="${tx.toFixed(1)}" y="${layer.fontSize.toFixed(1)}" text-anchor="${anchor}" ${skew} ` +
    `font-family="${esc(family)}" font-size="${layer.fontSize}" font-weight="${layer.fontWeight}" ` +
    `letter-spacing="${layer.letterSpacing}" fill="${fill}">${esc(layer.text)}</text>` +
    `</g>`
  );
}

function renderShapeLayer(layer: ShapeDesignLayer): string {
  const uid = nextUid();
  const defs: string[] = [];

  let fill = layer.fill;
  if (layer.fillGradient?.enabled) {
    const id = `sg-${uid}`;
    const v = gradientVector(layer.fillGradient.angle);
    defs.push(
      `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">` +
      `<stop offset="0%" stop-color="${layer.fillGradient.from}"/>` +
      `<stop offset="100%" stop-color="${layer.fillGradient.to}"/>` +
      `</linearGradient>`,
    );
    fill = `url(#${id})`;
  }

  const sw = layer.strokeWidth > 0 ? ` stroke="${layer.stroke}" stroke-width="${layer.strokeWidth}"` : "";
  const shape = shapePath(layer.shapeType, layer.width, layer.height, layer.cornerRadius);
  // Inject fill/stroke into the shape element
  const shapeWithFill = shape.replace(/>/, ` fill="${fill}"${sw}>`);

  return (
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    `<g transform="translate(${layer.x},${layer.y}) rotate(${layer.rotation},${layer.width / 2},${layer.height / 2})" opacity="${layer.opacity}">` +
    shapeWithFill +
    `</g>`
  );
}

function renderIconLayer(layer: IconDesignLayer): string {
  const uid = nextUid();
  const icon = ICON_BY_ID.get(layer.iconId);
  if (!icon) return "";
  const defs: string[] = [];

  let fill = layer.fill;
  if (layer.fillGradient?.enabled) {
    const id = `ig-${uid}`;
    const v = gradientVector(layer.fillGradient.angle);
    defs.push(
      `<linearGradient id="${id}" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">` +
      `<stop offset="0%" stop-color="${layer.fillGradient.from}"/>` +
      `<stop offset="100%" stop-color="${layer.fillGradient.to}"/>` +
      `</linearGradient>`,
    );
    fill = `url(#${id})`;
  }

  const sw = layer.strokeWidth > 0 ? layer.strokeWidth : 0;
  const vb = icon.viewBox ?? 100;
  const scale = layer.width / vb;

  return (
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    `<g transform="translate(${layer.x},${layer.y}) rotate(${layer.rotation},${layer.width / 2},${layer.height / 2})" opacity="${layer.opacity}" ` +
    `fill="${fill}" stroke="${fill}" stroke-width="${(sw / scale).toFixed(2)}">` +
    `<g transform="scale(${scale.toFixed(4)})">` +
    icon.content +
    `</g></g>`
  );
}

/** Renders an array of DesignLayers to an SVG fragment (no <svg> wrapper). */
export function renderLayers(layers: DesignLayer[]): string {
  return layers
    .filter((l) => l.visible)
    .map((l) => {
      switch (l.kind) {
        case "text":  return renderTextLayer(l);
        case "shape": return renderShapeLayer(l);
        case "icon":  return renderIconLayer(l);
        default:      return "";
      }
    })
    .join("");
}

// ── Default layer factories ─────────────────────────────────────────────────

function layerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultTextLayer(canvasW = 512, canvasH = 512): import("@/lib/types").TextDesignLayer {
  return {
    id: layerId(),
    kind: "text",
    visible: true,
    locked: false,
    opacity: 1,
    x: canvasW * 0.1,
    y: canvasH * 0.4,
    width: canvasW * 0.8,
    height: 80,
    rotation: 0,
    text: "Text",
    fontFamily: "inter",
    fontSize: 80,
    fontWeight: 700,
    color: "#ffffff",
    gradient: { enabled: false, from: "#ffffff", to: "#e63946", angle: 90 },
    letterSpacing: 0,
    italic: 0,
    align: "center",
  };
}

export function defaultShapeLayer(
  shape: import("@/lib/types").ShapeDesignLayer["shapeType"] = "rect",
  canvasW = 512, canvasH = 512,
): import("@/lib/types").ShapeDesignLayer {
  const size = Math.round(Math.min(canvasW, canvasH) * 0.35);
  return {
    id: layerId(),
    kind: "shape",
    visible: true,
    locked: false,
    opacity: 1,
    x: (canvasW - size) / 2,
    y: (canvasH - size) / 2,
    width: size,
    height: size,
    rotation: 0,
    shapeType: shape,
    fill: "#e63946",
    fillGradient: { enabled: false, from: "#e63946", to: "#7209b7", angle: 135 },
    stroke: "#ffffff",
    strokeWidth: 0,
    cornerRadius: 16,
  };
}

export function defaultIconLayer(
  iconId: string,
  canvasW = 512, canvasH = 512,
): import("@/lib/types").IconDesignLayer {
  const size = Math.round(Math.min(canvasW, canvasH) * 0.3);
  return {
    id: layerId(),
    kind: "icon",
    visible: true,
    locked: false,
    opacity: 1,
    x: (canvasW - size) / 2,
    y: (canvasH - size) / 2,
    width: size,
    height: size,
    rotation: 0,
    iconId,
    fill: "#ffffff",
    fillGradient: { enabled: false, from: "#ffffff", to: "#ffd700", angle: 90 },
    stroke: "none",
    strokeWidth: 0,
  };
}
