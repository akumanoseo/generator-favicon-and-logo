"use client";

import { useMemo, useState } from "react";
import { useFactory } from "@/lib/store";
import { EXPORT_SIZES } from "@/lib/types";
import { useT } from "@/lib/i18n";
import {
  exportBatch,
  recordFavicons,
  estimateZipSize,
  formatBytes,
  defaultExportOptions,
  LOGO_EXPORT_SIZES,
  type ExportOptions,
  type ExportProgress,
  type SaveMode,
} from "@/lib/export/client";

const FAV_SIZE_LABELS: Record<number, string> = {
  16: "16", 32: "32", 48: "48", 64: "64",
  180: "180", 192: "192", 512: "512",
};

const LOGO_SIZE_LABELS: Record<number, string> = {
  320: "320", 640: "640", 1024: "1024", 1920: "1920",
};

const SAVE_MODES: { value: SaveMode; label: string; hint: string }[] = [
  { value: "folder", label: "📂 Папка", hint: "Выбор папки на диске (Chrome/Edge)" },
  { value: "zip",    label: "🗜️ ZIP",   hint: "Один архив" },
  { value: "files",  label: "📄 Файлы", hint: "Каждый файл отдельно" },
];

export function ExportPanel() {
  const batch = useFactory((s) => s.batch);
  const config = useFactory((s) => s.config);
  const editorMode = useFactory((s) => s.editorMode);
  const { t } = useT();

  const [scope, setScope] = useState<"all" | "selected" | "current">("all");
  const [opt, setOpt] = useState<ExportOptions>(defaultExportOptions());
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = batch.filter((b) => b.selected);
  const batchItems =
    scope === "current"
      ? [{ config, mode: editorMode }]
      : scope === "selected"
        ? selected.map((b) => ({ config: b.config, mode: b.mode ?? ("favicon" as const) }))
        : batch.map((b) => ({ config: b.config, mode: b.mode ?? ("favicon" as const) }));

  const configs = batchItems.map((b) => b.config);
  const modes   = batchItems.map((b) => b.mode);
  const count   = configs.length;
  const faviconCount = batchItems.filter((b) => b.mode === "favicon").length;
  const logoCount    = batchItems.filter((b) => b.mode === "logo").length;

  const estimate = useMemo(() => estimateZipSize(count, opt), [count, opt]);
  const busy = progress !== null && progress.phase !== "done";

  const patchFav  = (patch: Partial<ExportOptions["favicon"]>) =>
    setOpt((o) => ({ ...o, favicon: { ...o.favicon, ...patch } }));
  const patchLogo = (patch: Partial<ExportOptions["logo"]>) =>
    setOpt((o) => ({ ...o, logo: { ...o.logo, ...patch } }));

  const toggleFavSize = (size: number) =>
    setOpt((o) => ({
      ...o,
      favicon: {
        ...o.favicon,
        sizes: o.favicon.sizes.includes(size)
          ? o.favicon.sizes.filter((s) => s !== size)
          : [...o.favicon.sizes, size].sort((a, b) => a - b),
      },
    }));

  const toggleLogoSize = (size: number) =>
    setOpt((o) => ({
      ...o,
      logo: {
        ...o.logo,
        sizes: o.logo.sizes.includes(size)
          ? o.logo.sizes.filter((s) => s !== size)
          : [...o.logo.sizes, size].sort((a, b) => a - b),
      },
    }));

  const nothingSelected =
    faviconCount > 0 &&
    !opt.favicon.png && !opt.favicon.webp && !opt.favicon.svg;

  const progressText = (p: ExportProgress): string => {
    switch (p.phase) {
      case "rasterizing": return `Рендер ${p.done}/${p.total}…`;
      case "packaging":   return "Упаковка…";
      case "downloading": return `Сохранение ${p.done}/${p.total}…`;
      default:            return "Готово ✓";
    }
  };

  const run = async () => {
    if (!count || busy || nothingSelected) return;
    setError(null);
    try {
      await exportBatch(configs, opt, setProgress, modes);
      void recordFavicons(configs);
      setTimeout(() => setProgress(null), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      setProgress(null);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-200">
        {t("export.title")}
      </h3>

      {/* Scope */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1 text-xs">
        {([
          ["all",      `Батч (${batch.length})`],
          ["selected", `Выбранные (${selected.length})`],
          ["current",  "Текущий"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
              scope === value ? "bg-akuma-red text-white" : "text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Фавиконки ── */}
      {(faviconCount > 0 || (scope === "current" && editorMode === "favicon")) && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <span>🖼️</span>
            <span className="field-label">Фавиконки</span>
            {faviconCount > 0 && scope !== "current" && (
              <span className="chip ml-auto">{faviconCount} шт</span>
            )}
          </div>

          <div className="flex gap-4">
            {(["webp", "png", "svg"] as const).map((fmt) => (
              <label key={fmt} className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-akuma-red"
                  checked={opt.favicon[fmt]}
                  onChange={(e) => patchFav({ [fmt]: e.target.checked })}
                />
                {fmt.toUpperCase()}
              </label>
            ))}
          </div>

          {(opt.favicon.png || opt.favicon.webp) && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Размеры (px)</span>
                <button
                  className="text-[10px] text-neutral-500 hover:text-akuma-redBright"
                  onClick={() => patchFav({
                    sizes: opt.favicon.sizes.length === EXPORT_SIZES.length ? [] : [...EXPORT_SIZES],
                  })}
                >
                  {opt.favicon.sizes.length === EXPORT_SIZES.length ? "Снять все" : "Все"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXPORT_SIZES.map((size) => {
                  const on = opt.favicon.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleFavSize(size)}
                      className={`rounded-md border px-2 py-1 text-[11px] transition ${
                        on
                          ? "border-akuma-redBright bg-akuma-red/20 text-white"
                          : "border-white/10 text-neutral-400 hover:border-white/25"
                      }`}
                    >
                      {FAV_SIZE_LABELS[size]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Логотипы ── */}
      {logoCount > 0 && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <span>🔤</span>
            <span className="field-label">Логотипы</span>
            <span className="chip ml-auto">{logoCount} шт</span>
          </div>

          <div className="flex gap-4">
            {(["webp", "png", "svg"] as const).map((fmt) => (
              <label key={fmt} className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-akuma-red"
                  checked={opt.logo[fmt]}
                  onChange={(e) => patchLogo({ [fmt]: e.target.checked })}
                />
                {fmt.toUpperCase()}
              </label>
            ))}
          </div>

          {(opt.logo.png || opt.logo.webp) && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Ширина (px)</span>
                <button
                  className="text-[10px] text-neutral-500 hover:text-akuma-redBright"
                  onClick={() => patchLogo({
                    sizes: opt.logo.sizes.length === LOGO_EXPORT_SIZES.length ? [] : [...LOGO_EXPORT_SIZES],
                  })}
                >
                  {opt.logo.sizes.length === LOGO_EXPORT_SIZES.length ? "Снять все" : "Все"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LOGO_EXPORT_SIZES.map((size) => {
                  const on = opt.logo.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleLogoSize(size)}
                      className={`rounded-md border px-2 py-1 text-[11px] transition ${
                        on
                          ? "border-akuma-redBright bg-akuma-red/20 text-white"
                          : "border-white/10 text-neutral-400 hover:border-white/25"
                      }`}
                    >
                      {LOGO_SIZE_LABELS[size]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-neutral-600">
                {opt.logo.sizes.length > 1 ? "logo-640.webp, logo-1920.webp …" : "logo.webp"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Режим сохранения ── */}
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-1.5">
        <span className="field-label block mb-2">Сохранение</span>
        {SAVE_MODES.map(({ value, label, hint }) => (
          <label key={value} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              name="saveMode"
              className="accent-akuma-red mt-0.5"
              checked={opt.saveMode === value}
              onChange={() => setOpt((o) => ({ ...o, saveMode: value }))}
            />
            <div>
              <span className={`text-xs font-medium ${opt.saveMode === value ? "text-white" : "text-neutral-300 group-hover:text-white"}`}>
                {label}
              </span>
              <span className="ml-2 text-[10px] text-neutral-600">{hint}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Сводка */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-neutral-400">
        <span>{count} {count === 1 ? "элемент" : "элементов"}</span>
        <span className="font-mono text-neutral-300">~{formatBytes(estimate)}</span>
      </div>

      <button
        className="btn-primary w-full disabled:opacity-50"
        disabled={!count || busy || nothingSelected}
        onClick={run}
      >
        {busy && progress ? progressText(progress) : `Экспорт (${count})`}
      </button>

      {nothingSelected && !busy && (
        <p className="text-[11px] text-amber-400">Выберите хотя бы один формат</p>
      )}

      {progress && (
        <div>
          <div className="mb-1 flex justify-between text-[11px] text-neutral-400">
            <span>{progressText(progress)}</span>
            <span className="font-mono">{progress.done}/{progress.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all ${progress.phase === "done" ? "bg-emerald-500" : "bg-akuma-redBright"}`}
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
