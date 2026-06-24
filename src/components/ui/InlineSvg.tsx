"use client";

import { CSSProperties } from "react";

interface InlineSvgProps {
  svg: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Renders an SVG string inline in the DOM so page-level fonts (Google Fonts
 * loaded via <link> in layout.tsx) are accessible to the SVG text elements.
 * Using <img src="data:image/svg+xml,..."> blocks external font URLs inside
 * the SVG document — inline SVG has no such restriction.
 */
export function InlineSvg({ svg, width, height, className, style, title }: InlineSvgProps) {
  return (
    <div
      className={className}
      style={{ width, height, overflow: "hidden", lineHeight: 0, ...style }}
      title={title}
      // Inline SVG can use fonts loaded by the page via <link> in layout.tsx.
      // <img src="data:image/svg+xml,..."> blocks external font URLs inside the SVG.
      dangerouslySetInnerHTML={{ __html: svg.replace(
        /^<svg /,
        '<svg style="width:100%;height:100%;" '
      ) }}
    />
  );
}
