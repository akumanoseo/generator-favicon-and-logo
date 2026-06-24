"use client";

import { useMemo } from "react";
import { useFactory } from "@/lib/store";
import { Section } from "@/components/ui/Controls";
import { PRESETS } from "@/lib/engine/presets";
import { defaultConfig } from "@/lib/engine/defaults";
import { renderSVG } from "@/lib/engine/render";
import { InlineSvg } from "@/components/ui/InlineSvg";
import { useT } from "@/lib/i18n";

export function PresetsPanel() {
  const applyPreset = useFactory((s) => s.applyPreset);
  const brandName = useFactory((s) => s.config.brandName);
  const { t } = useT();

  // Precompute a thumbnail per preset, using the current brand for the glyph.
  const thumbs = useMemo(() => {
    const base = { ...defaultConfig(), brandName, text: "" };
    return PRESETS.map((p) => renderSVG({ ...base, ...p.apply }));
  }, [brandName]);

  return (
    <Section title={t("presets.title")} icon={<span>🎯</span>} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-2 transition hover:border-akuma-redBright/60 hover:bg-akuma-red/10"
            title={p.description}
          >
            <InlineSvg svg={thumbs[i]} width={48} height={48} className="rounded-md" />
            <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white">{p.name}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}
