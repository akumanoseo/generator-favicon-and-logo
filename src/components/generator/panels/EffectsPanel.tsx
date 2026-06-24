"use client";

import { useFactory } from "@/lib/store";
import { Section, Slider, Toggle } from "@/components/ui/Controls";
import type { EffectConfig } from "@/lib/types";
import { useT } from "@/lib/i18n";

const TOGGLES: { key: keyof EffectConfig; label: string }[] = [
  { key: "textShadow", label: "fx.textShadow" },
  { key: "glow", label: "fx.glow" },
  { key: "neon", label: "fx.neon" },
  { key: "innerShadow", label: "fx.innerShadow" },
  { key: "outerShadow", label: "fx.outerShadow" },
  { key: "metallic", label: "fx.metallic" },
  { key: "glass", label: "fx.glass" },
  { key: "noise", label: "fx.noise" },
];

export function EffectsPanel() {
  const config = useFactory((s) => s.config);
  const setEffects = useFactory((s) => s.setEffects);
  const pushHistory = useFactory((s) => s.pushHistory);
  const { t } = useT();
  const fx = config.effects;

  return (
    <Section title={t("fx.title")} icon={<span>✨</span>} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {TOGGLES.map((tg) => (
          <Toggle
            key={tg.key}
            label={t(tg.label)}
            checked={Boolean(fx[tg.key])}
            onChange={(v) => {
              pushHistory();
              setEffects({ [tg.key]: v } as Partial<EffectConfig>);
            }}
          />
        ))}
      </div>
      <Slider label={t("fx.blur")} value={fx.blur} min={0} max={20} unit="px" onChange={(v) => setEffects({ blur: v })} onBeforeChange={pushHistory} />
      <p className="text-[11px] text-neutral-500">{t("fx.hint")}</p>
    </Section>
  );
}
