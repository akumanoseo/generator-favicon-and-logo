"use client";

import { useFactory } from "@/lib/store";
import { Section, Slider, Toggle } from "@/components/ui/Controls";
import { ColorPicker } from "@/components/generator/ColorPicker";
import type { ShapeKind } from "@/lib/types";
import { useT } from "@/lib/i18n";

const SHAPES: { value: ShapeKind; key: string; glyph: string }[] = [
  { value: "square", key: "shape.square", glyph: "■" },
  { value: "rounded", key: "shape.rounded", glyph: "▢" },
  { value: "circle", key: "shape.circle", glyph: "●" },
  { value: "squircle", key: "shape.squircle", glyph: "⬭" },
  { value: "hexagon", key: "shape.hexagon", glyph: "⬡" },
  { value: "none", key: "shape.none", glyph: "∅" },
];

export function BackgroundPanel() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const { t } = useT();
  const bg = config.bgGradient;

  const set = (patch: Partial<typeof config>) => {
    pushHistory();
    setConfig(patch);
  };

  return (
    <Section title={t("bg.title")} icon={<span>⬛</span>} defaultOpen={false}>
      <div>
        <span className="field-label">{t("bg.shape")}</span>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set({ shape: s.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border py-2 transition ${
                config.shape === s.value ? "border-akuma-redBright bg-akuma-red/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <span className="text-lg leading-none">{s.glyph}</span>
              <span className="text-[10px] text-neutral-400">{t(s.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {config.shape === "rounded" && (
        <Slider label={t("bg.corner")} value={config.cornerRadius} min={0} max={256} unit="px" onChange={(v) => setConfig({ cornerRadius: v })} onBeforeChange={pushHistory} />
      )}

      {config.shape !== "none" && (
        <>
          <Slider label={t("bg.padding")} value={config.padding} min={0} max={120} unit="px" onChange={(v) => setConfig({ padding: v })} onBeforeChange={pushHistory} />

          <ColorPicker label={t("bg.fill")} value={config.bgColor} onChange={(hex) => setConfig({ bgColor: hex })} onBefore={pushHistory} />
          <Slider label={t("bg.opacity")} value={config.bgOpacity} min={0} max={1} step={0.05} onChange={(v) => setConfig({ bgOpacity: v })} onBeforeChange={pushHistory} />

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <Toggle
              label={t("bg.gradient")}
              checked={bg.enabled}
              onChange={(v) => {
                pushHistory();
                setConfig({ bgGradient: { ...bg, enabled: v } });
              }}
            />
            {bg.enabled && (
              <div className="mt-3 space-y-3">
                <ColorPicker label={t("color.from")} compact value={bg.from} onChange={(hex) => setConfig({ bgGradient: { ...bg, from: hex } })} onBefore={pushHistory} />
                <ColorPicker label={t("color.to")} compact value={bg.to} onChange={(hex) => setConfig({ bgGradient: { ...bg, to: hex } })} onBefore={pushHistory} />
                <Slider label={t("color.angle")} value={bg.angle} min={0} max={360} unit="°" onChange={(v) => setConfig({ bgGradient: { ...bg, angle: v } })} onBeforeChange={pushHistory} />
              </div>
            )}
          </div>

          <Slider label={t("bg.border")} value={config.borderWidth} min={0} max={48} unit="px" onChange={(v) => setConfig({ borderWidth: v })} onBeforeChange={pushHistory} />
          {config.borderWidth > 0 && (
            <ColorPicker label={t("bg.borderColor")} compact value={config.borderColor} onChange={(hex) => setConfig({ borderColor: hex })} onBefore={pushHistory} />
          )}

          <Toggle label={t("bg.shadow")} checked={config.shadow} onChange={(v) => set({ shadow: v })} />
          <Toggle label={t("bg.glow")} checked={config.glow} onChange={(v) => set({ glow: v })} />
          {config.glow && <ColorPicker label={t("bg.glowColor")} compact value={config.glowColor} onChange={(hex) => setConfig({ glowColor: hex })} onBefore={pushHistory} />}
        </>
      )}
    </Section>
  );
}
