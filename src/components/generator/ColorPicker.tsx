"use client";

import { useRef } from "react";
import { PALETTE, isValidHex, normalizeHex } from "@/lib/engine/colors";
import { useFactory } from "@/lib/store";
import { useT } from "@/lib/i18n";

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

/**
 * Color control: predefined palette, custom picker, recent colors,
 * random + EyeDropper support. Calls `onBefore` once before a change so
 * the caller can push an undo checkpoint.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  onBefore,
  compact = false,
}: {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  onBefore?: () => void;
  compact?: boolean;
}) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const recentColors = useFactory((s) => s.recentColors);
  const addRecentColor = useFactory((s) => s.addRecentColor);
  const { t } = useT();

  const commit = (hex: string) => {
    onBefore?.();
    const norm = normalizeHex(hex);
    onChange(norm);
    addRecentColor(norm);
  };

  const random = () => commit(PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  const eyedrop = async () => {
    if (!window.EyeDropper) return;
    try {
      const res = await new window.EyeDropper().open();
      commit(res.sRGBHex);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="space-y-2">
      {label && <span className="field-label">{label}</span>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => nativeRef.current?.click()}
          className="h-9 w-9 shrink-0 rounded-lg border border-white/15 shadow-inner"
          style={{ background: value }}
          title="Open color picker"
        />
        <input
          ref={nativeRef}
          type="color"
          value={isValidHex(value) ? normalizeHex(value) : "#000000"}
          onChange={(e) => commit(e.target.value)}
          className="sr-only"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (isValidHex(v)) commit(v);
            else onChange(v); // allow intermediate typing
          }}
          className="input-base flex-1 font-mono text-xs"
          spellCheck={false}
        />
        <button type="button" onClick={random} className="btn-ghost btn-sm" title={t("color.randomTitle")}>
          🎲
        </button>
        {typeof window !== "undefined" && window.EyeDropper && (
          <button type="button" onClick={eyedrop} className="btn-ghost btn-sm" title={t("color.pickTitle")}>
            💧
          </button>
        )}
      </div>

      {!compact && (
        <div className="grid grid-cols-10 gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => commit(c)}
              className={`aspect-square rounded-md border transition hover:scale-110 ${
                value.toLowerCase() === c.toLowerCase() ? "border-white ring-1 ring-akuma-redBright" : "border-white/10"
              }`}
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      )}

      {recentColors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">{t("color.recent")}</span>
          {recentColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => commit(c)}
              className="h-5 w-5 rounded border border-white/10 transition hover:scale-110"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}
