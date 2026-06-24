"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { useFactory } from "@/lib/store";
import { renderSVG } from "@/lib/engine/render";
import { renderLogoSVG, logoSize } from "@/lib/engine/logo";
import { CANVAS } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { InlineSvg } from "@/components/ui/InlineSvg";

export function Editor() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const editorMode = useFactory((s) => s.editorMode);
  const { t } = useT();

  const isLogo = editorMode === "logo";
  const logoLayout = config.logo?.layout ?? "horizontal";

  const svg = useMemo(() => {
    if (!isLogo) return renderSVG(config);
    const sz = logoSize(logoLayout);
    return renderLogoSVG(config, sz);
  }, [config, isLogo, logoLayout]);

  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });

  const drag = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const scaleFactor = useCallback(() => {
    const el = stageRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    return CANVAS / (rect.width / zoom);
  }, [zoom]);

  const onPointerDownText = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pushHistory();
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, baseX: config.offsetX, baseY: config.offsetY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panning.current) {
      setPan({ x: panning.current.px + (e.clientX - panning.current.x), y: panning.current.py + (e.clientY - panning.current.y) });
      return;
    }
    if (!drag.current?.active) return;
    const f = scaleFactor();
    let nx = drag.current.baseX + (e.clientX - drag.current.startX) * f;
    let ny = drag.current.baseY + (e.clientY - drag.current.startY) * f;
    const snapV = Math.abs(nx) < 10;
    const snapH = Math.abs(ny) < 10;
    if (snapV) nx = 0;
    if (snapH) ny = 0;
    setGuides({ v: snapV, h: snapH });
    setConfig({ offsetX: Math.round(nx), offsetY: Math.round(ny) });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) drag.current.active = false;
    panning.current = null;
    setGuides({ v: false, h: false });
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.4, z - e.deltaY * 0.001)));
      return;
    }
    e.preventDefault();
    const delta = e.deltaY < 0 ? 6 : -6;
    setConfig({ fontSize: Math.min(420, Math.max(40, config.fontSize + delta)) });
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    panning.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="flex h-full flex-col">
      {/* Заголовок + зум */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isLogo ? "🔤" : "🖼️"}</span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            {isLogo ? "Превью логотипа" : "Превью фавиконки"}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip">{Math.round(zoom * 100)}%</span>
          <button className="btn-ghost btn-sm" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>−</button>
          <button className="btn-ghost btn-sm" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</button>
          <button className="btn-ghost btn-sm" onClick={resetView}>{t("editor.reset")}</button>
        </div>
      </div>

      {/* Канвас */}
      <div
        ref={stageRef}
        onPointerDown={onStagePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onWheel={onWheel}
        className="checkerboard relative mx-auto flex select-none items-center justify-center overflow-hidden rounded-2xl border border-white/10"
        style={{
          touchAction: "none",
          aspectRatio: isLogo ? (logoLayout === "stacked" ? "1 / 1" : "1024 / 320") : "1 / 1",
          width: "100%",
          maxWidth: isLogo && logoLayout !== "stacked" ? "640px" : "480px",
        }}
      >
        <div
          className="relative h-full w-full"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <InlineSvg
            svg={svg}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          />

          {!isLogo && (
            <>
              <div className="pointer-events-none absolute inset-[10%] rounded-xl border border-dashed border-white/20" />
              {guides.v && <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-akuma-redBright/70" />}
              {guides.h && <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-akuma-redBright/70" />}
              <div
                onPointerDown={onPointerDownText}
                className="absolute cursor-move rounded-md transition hover:bg-white/5"
                style={{
                  left: "25%", top: "25%", width: "50%", height: "50%",
                  transform: `translate(${(config.offsetX / CANVAS) * 100}%, ${(config.offsetY / CANVAS) * 100}%)`,
                }}
                title="Drag to move · wheel to scale · Ctrl+wheel to zoom"
              />
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-500">{t("editor.hint")}</p>
    </div>
  );
}
