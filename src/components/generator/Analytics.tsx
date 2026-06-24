"use client";

import { useMemo } from "react";
import { useFactory } from "@/lib/store";
import { collectionDiversity } from "@/lib/engine/uniqueness";
import { getFont } from "@/lib/engine/fonts";
import { useT } from "@/lib/i18n";

/** Batch statistics: counts, diversity score, duplicate detection, distributions. */
export function Analytics() {
  const batch = useFactory((s) => s.batch);
  const { t } = useT();

  const stats = useMemo(() => {
    const total = batch.length;
    const configs = batch.map((b) => b.config);
    const sigCount = new Map<string, number>();
    const fontCount = new Map<string, number>();
    const shapeCount = new Map<string, number>();
    for (const b of batch) {
      sigCount.set(b.signature, (sigCount.get(b.signature) ?? 0) + 1);
      fontCount.set(b.config.fontFamily, (fontCount.get(b.config.fontFamily) ?? 0) + 1);
      shapeCount.set(b.config.shape, (shapeCount.get(b.config.shape) ?? 0) + 1);
    }
    const duplicates = [...sigCount.values()].filter((n) => n > 1).reduce((a, n) => a + (n - 1), 0);
    const unique = sigCount.size;
    const diversity = collectionDiversity(configs);
    const topFonts = [...fontCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topShapes = [...shapeCount.entries()].sort((a, b) => b[1] - a[1]);
    return { total, unique, duplicates, diversity, topFonts, topShapes };
  }, [batch]);

  if (stats.total === 0) return null;

  const diversityColor = stats.diversity >= 70 ? "text-emerald-400" : stats.diversity >= 45 ? "text-amber-400" : "text-red-400";

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-200">
        {t("stats.title")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("stats.total")} value={String(stats.total)} />
        <Stat label={t("stats.unique")} value={String(stats.unique)} />
        <Stat label={t("stats.duplicates")} value={String(stats.duplicates)} accent={stats.duplicates > 0 ? "text-amber-400" : undefined} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="field-label">{t("stats.diversity")}</span>
          <span className={`font-mono font-semibold ${diversityColor}`}>{stats.diversity}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gradient-to-r from-akuma-red to-akuma-redBright" style={{ width: `${stats.diversity}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <div className="field-label mb-1">{t("stats.topFonts")}</div>
          {stats.topFonts.map(([id, n]) => (
            <div key={id} className="flex justify-between text-neutral-400">
              <span className="truncate">{getFont(id).name}</span>
              <span className="font-mono">{n}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="field-label mb-1">{t("stats.shapes")}</div>
          {stats.topShapes.map(([shape, n]) => (
            <div key={shape} className="flex justify-between text-neutral-400">
              <span className="capitalize">{shape}</span>
              <span className="font-mono">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2 text-center">
      <div className={`text-xl font-bold ${accent ?? "text-neutral-100"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}
