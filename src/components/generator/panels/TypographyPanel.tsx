"use client";

import { useFactory } from "@/lib/store";
import { Section, Slider, Segmented } from "@/components/ui/Controls";
import { FONTS } from "@/lib/engine/fonts";
import type { HAlign, VAlign } from "@/lib/types";
import { useT } from "@/lib/i18n";

export function TypographyPanel() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const { t } = useT();

  const set = (patch: Partial<typeof config>) => {
    pushHistory();
    setConfig(patch);
  };

  return (
    <Section title={t("typo.title")} icon={<span>🔤</span>} defaultOpen={false}>
      <div>
        <span className="field-label">{t("typo.font")}</span>
        <div className="scroll-thin mt-1 grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => set({ fontFamily: f.id })}
              className={`rounded-lg border px-2 py-2 text-center transition ${
                config.fontFamily === f.id
                  ? "border-akuma-redBright bg-akuma-red/15"
                  : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
              title={f.name}
            >
              <span className="block truncate text-base leading-tight text-neutral-100" style={{ fontFamily: f.family }}>
                Aa
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-neutral-500">{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Slider label={t("typo.size")} value={config.fontSize} min={60} max={420} unit="px" onChange={(v) => setConfig({ fontSize: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.weight")} value={config.fontWeight} min={100} max={900} step={100} onChange={(v) => setConfig({ fontWeight: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.letter")} value={config.letterSpacing} min={-30} max={60} unit="px" onChange={(v) => setConfig({ letterSpacing: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.line")} value={config.lineHeight} min={0.6} max={2} step={0.05} onChange={(v) => setConfig({ lineHeight: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.rotation")} value={config.rotation} min={-180} max={180} unit="°" onChange={(v) => setConfig({ rotation: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.italic")} value={config.italic} min={0} max={30} unit="°" onChange={(v) => setConfig({ italic: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.offsetX")} value={config.offsetX} min={-220} max={220} unit="px" onChange={(v) => setConfig({ offsetX: v })} onBeforeChange={pushHistory} />
      <Slider label={t("typo.offsetY")} value={config.offsetY} min={-220} max={220} unit="px" onChange={(v) => setConfig({ offsetY: v })} onBeforeChange={pushHistory} />

      <div>
        <span className="field-label">{t("typo.halign")}</span>
        <div className="mt-1">
          <Segmented<HAlign>
            value={config.hAlign}
            onChange={(v) => set({ hAlign: v })}
            options={[
              { value: "left", label: t("align.left") },
              { value: "center", label: t("align.center") },
              { value: "right", label: t("align.right") },
            ]}
          />
        </div>
      </div>
      <div>
        <span className="field-label">{t("typo.valign")}</span>
        <div className="mt-1">
          <Segmented<VAlign>
            value={config.vAlign}
            onChange={(v) => set({ vAlign: v })}
            options={[
              { value: "top", label: t("align.top") },
              { value: "middle", label: t("align.middle") },
              { value: "bottom", label: t("align.bottom") },
            ]}
          />
        </div>
      </div>
    </Section>
  );
}
