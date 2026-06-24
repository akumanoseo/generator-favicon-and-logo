"use client";

import { useMemo } from "react";
import { useFactory } from "@/lib/store";
import { renderSVG } from "@/lib/engine/render";
import { InlineSvg } from "@/components/ui/InlineSvg";
import { useT } from "@/lib/i18n";

const SIZES = [16, 32, 64, 128, 180];
const BACKGROUNDS: { id: string; key: string; className: string }[] = [
  { id: "dark", key: "preview.dark", className: "bg-neutral-900" },
  { id: "light", key: "preview.light", className: "bg-neutral-100" },
  { id: "checker", key: "preview.transparent", className: "checkerboard" },
];

export function PreviewGrid() {
  const config = useFactory((s) => s.config);
  const { t } = useT();
  const svg = useMemo(() => renderSVG(config), [config]);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-300">{t("preview.title")}</h3>
      <div className="space-y-3">
        {BACKGROUNDS.map((bg) => (
          <div key={bg.id} className="glass-card p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">{t(bg.key)}</div>
            <div className={`flex flex-wrap items-end gap-4 rounded-lg p-3 ${bg.className}`}>
              {SIZES.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <InlineSvg svg={svg} width={s} height={s} />
                  <span className="text-[10px] text-neutral-500">{s}px</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
