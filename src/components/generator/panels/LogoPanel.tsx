"use client";

import { useFactory } from "@/lib/store";
import { Section, Segmented, Slider, Toggle } from "@/components/ui/Controls";
import { ColorPicker } from "@/components/generator/ColorPicker";
import { FONTS } from "@/lib/engine/fonts";
import type { LogoLayout } from "@/lib/types";
import { useT } from "@/lib/i18n";

export function LogoPanel() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const { t } = useT();
  const lg = config.logo;

  const patchLogo = (patch: Partial<typeof lg>) => {
    pushHistory();
    setConfig({ logo: { ...lg, ...patch } });
  };

  const patchLogoSilent = (patch: Partial<typeof lg>) => {
    setConfig({ logo: { ...lg, ...patch } });
  };

  return (
    <Section title="Настройки логотипа" icon={<span>🔤</span>} defaultOpen={false}>
      <div>
        <span className="field-label">{t("logo.layout")}</span>
        <div className="mt-1">
          <Segmented<LogoLayout>
            value={lg.layout}
            onChange={(v) => patchLogo({ layout: v })}
            options={[
              { value: "horizontal", label: t("logo.horizontal") },
              { value: "stacked", label: t("logo.stacked") },
            ]}
          />
        </div>
      </div>

      <Toggle
        label="Показывать иконку фавиконки"
        checked={lg.showFaviconIcon !== false}
        onChange={(v) => patchLogo({ showFaviconIcon: v })}
      />

      <Toggle label={t("logo.showWordmark")} checked={lg.showWordmark} onChange={(v) => patchLogo({ showWordmark: v })} />

      {lg.showWordmark && (
        <>
          <div>
            <span className="field-label">{t("logo.wordmarkText")}</span>
            <input
              className="input-base mt-1"
              value={lg.wordmarkText}
              placeholder={t("logo.wordmarkAuto", { v: config.brandName || "Brand" })}
              onFocus={pushHistory}
              onChange={(e) => setConfig({ logo: { ...lg, wordmarkText: e.target.value } })}
            />
          </div>

          {/* ── Font ── */}
          <div>
            <span className="field-label">{t("logo.wordmarkFont")}</span>
            <div className="scroll-thin mt-1 grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => patchLogo({ wordmarkFont: "" })}
                className={`rounded-lg border px-2 py-2 text-center transition ${
                  !lg.wordmarkFont
                    ? "border-akuma-redBright bg-akuma-red/15"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <span className="block truncate text-[10px] text-neutral-400">{t("logo.sameFont", { v: "" })}</span>
              </button>
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => patchLogo({ wordmarkFont: f.id })}
                  className={`rounded-lg border px-2 py-2 text-center transition ${
                    lg.wordmarkFont === f.id
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

          {/* ── Typography sliders ── */}
          <Slider
            label={t("typo.size") + " (0=авто)"}
            value={lg.wordmarkSize ?? 0}
            min={0}
            max={300}
            unit="px"
            onChange={(v) => patchLogoSilent({ wordmarkSize: v })}
            onBeforeChange={pushHistory}
          />
          <Slider
            label={t("typo.weight")}
            value={lg.wordmarkWeight ?? 700}
            min={100}
            max={900}
            step={100}
            onChange={(v) => patchLogoSilent({ wordmarkWeight: v })}
            onBeforeChange={pushHistory}
          />
          <Slider
            label={t("typo.letter")}
            value={lg.wordmarkLetterSpacing ?? 0}
            min={-10}
            max={60}
            unit="px"
            onChange={(v) => patchLogoSilent({ wordmarkLetterSpacing: v })}
            onBeforeChange={pushHistory}
          />
          <Slider
            label={t("typo.italic")}
            value={lg.wordmarkItalic ?? 0}
            min={0}
            max={30}
            unit="°"
            onChange={(v) => patchLogoSilent({ wordmarkItalic: v })}
            onBeforeChange={pushHistory}
          />
          <Slider
            label="Смещение X"
            value={lg.wordmarkOffsetX ?? 0}
            min={-500}
            max={500}
            unit="px"
            onChange={(v) => patchLogoSilent({ wordmarkOffsetX: v })}
            onBeforeChange={pushHistory}
          />
          <Slider
            label="Смещение Y"
            value={lg.wordmarkOffsetY ?? 0}
            min={-300}
            max={300}
            unit="px"
            onChange={(v) => patchLogoSilent({ wordmarkOffsetY: v })}
            onBeforeChange={pushHistory}
          />

          {/* ── Color / Gradient ── */}
          <ColorPicker
            label={t("logo.wordmarkColor")}
            compact
            value={lg.wordmarkColor}
            onChange={(hex) => setConfig({ logo: { ...lg, wordmarkColor: hex } })}
            onBefore={pushHistory}
          />

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <Toggle
              label={t("color.gradientText")}
              checked={lg.wordmarkGradient?.enabled ?? false}
              onChange={(v) => patchLogo({ wordmarkGradient: { ...(lg.wordmarkGradient ?? { from: "#ffffff", to: "#e63946", angle: 90 }), enabled: v } })}
            />
            {lg.wordmarkGradient?.enabled && (
              <div className="mt-3 space-y-2">
                <ColorPicker
                  label={t("color.from")}
                  compact
                  value={lg.wordmarkGradient.from}
                  onChange={(hex) => patchLogo({ wordmarkGradient: { ...lg.wordmarkGradient!, from: hex } })}
                  onBefore={pushHistory}
                />
                <ColorPicker
                  label={t("color.to")}
                  compact
                  value={lg.wordmarkGradient.to}
                  onChange={(hex) => patchLogo({ wordmarkGradient: { ...lg.wordmarkGradient!, to: hex } })}
                  onBefore={pushHistory}
                />
                <Slider
                  label={t("color.angle")}
                  value={lg.wordmarkGradient.angle}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={(v) => patchLogoSilent({ wordmarkGradient: { ...lg.wordmarkGradient!, angle: v } })}
                  onBeforeChange={pushHistory}
                />
              </div>
            )}
          </div>
        </>
      )}

      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <Toggle label={t("logo.bg")} checked={lg.bgEnabled} onChange={(v) => patchLogo({ bgEnabled: v })} />
        {lg.bgEnabled && (
          <div className="mt-3">
            <ColorPicker label={t("logo.bgColor")} compact value={lg.bgColor} onChange={(hex) => setConfig({ logo: { ...lg, bgColor: hex } })} onBefore={pushHistory} />
          </div>
        )}
      </div>
    </Section>
  );
}
