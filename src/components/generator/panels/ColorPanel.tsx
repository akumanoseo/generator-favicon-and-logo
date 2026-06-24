"use client";

import { useFactory } from "@/lib/store";
import { Section, Slider, Toggle } from "@/components/ui/Controls";
import { ColorPicker } from "@/components/generator/ColorPicker";
import { useT } from "@/lib/i18n";

export function ColorPanel() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const { t } = useT();
  const g = config.textGradient;

  return (
    <Section title={t("color.title")} icon={<span>🎨</span>} defaultOpen={false}>
      <ColorPicker label={t("color.color")} value={config.textColor} onChange={(hex) => setConfig({ textColor: hex })} onBefore={pushHistory} />

      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <Toggle
          label={t("color.gradientText")}
          checked={g.enabled}
          onChange={(v) => {
            pushHistory();
            setConfig({ textGradient: { ...g, enabled: v } });
          }}
        />
        {g.enabled && (
          <div className="mt-3 space-y-3">
            <ColorPicker label={t("color.from")} compact value={g.from} onChange={(hex) => setConfig({ textGradient: { ...g, from: hex } })} onBefore={pushHistory} />
            <ColorPicker label={t("color.to")} compact value={g.to} onChange={(hex) => setConfig({ textGradient: { ...g, to: hex } })} onBefore={pushHistory} />
            <Slider label={t("color.angle")} value={g.angle} min={0} max={360} unit="°" onChange={(v) => setConfig({ textGradient: { ...g, angle: v } })} onBeforeChange={pushHistory} />
          </div>
        )}
      </div>
    </Section>
  );
}
