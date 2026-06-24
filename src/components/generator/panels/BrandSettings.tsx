"use client";

import { useFactory } from "@/lib/store";
import { Section, Toggle } from "@/components/ui/Controls";
import { resolveText } from "@/lib/engine/defaults";
import { useT } from "@/lib/i18n";

export function BrandSettings() {
  const config = useFactory((s) => s.config);
  const setConfig = useFactory((s) => s.setConfig);
  const pushHistory = useFactory((s) => s.pushHistory);
  const randomBrand = useFactory((s) => s.randomBrand);
  const clearBrand = useFactory((s) => s.clearBrand);
  const { t } = useT();

  return (
    <Section title={t("brand.title")} icon={<span>🏷️</span>} defaultOpen={false}>
      <div>
        <span className="field-label">{t("brand.name")}</span>
        <input
          className="input-base mt-1"
          value={config.brandName}
          placeholder="Stakego"
          onFocus={pushHistory}
          onChange={(e) => setConfig({ brandName: e.target.value })}
        />
      </div>
      <div>
        <span className="field-label">{t("brand.text")}</span>
        <input
          className="input-base mt-1"
          value={config.text}
          placeholder={t("brand.autoText", { v: resolveText(config) })}
          onFocus={pushHistory}
          onChange={(e) => setConfig({ text: e.target.value })}
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          {t("brand.hint")} <span className="font-mono text-akuma-redBright">{resolveText(config)}</span>
        </p>
      </div>
      <Toggle
        label={t("brand.uppercase")}
        checked={config.autoUppercase}
        onChange={(v) => {
          pushHistory();
          setConfig({ autoUppercase: v });
        }}
      />
      <div className="flex gap-2">
        <button type="button" className="btn-ghost flex-1" onClick={randomBrand}>
          {t("brand.random")}
        </button>
        <button type="button" className="btn-ghost flex-1" onClick={clearBrand}>
          {t("brand.clear")}
        </button>
      </div>
    </Section>
  );
}
