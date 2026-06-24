"use client";

import { useMemo, useState } from "react";
import { useFactory } from "@/lib/store";
import { Slider, Toggle } from "@/components/ui/Controls";
import { generateDiverseBatch } from "@/lib/engine/uniqueness";
import type { FaviconConfig } from "@/lib/types";
import { useT } from "@/lib/i18n";

const SAMPLE = "Stakego\nBetoro\nSpinix\nVelobet";

/** Parses the textarea into a clean, de-duplicated brand list. */
function parseBrands(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/[\n,;]+/)) {
    const b = line.trim();
    if (b && !seen.has(b.toLowerCase())) {
      seen.add(b.toLowerCase());
      out.push(b);
    }
  }
  return out;
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

export function BulkMode() {
  const config = useFactory((s) => s.config);
  const batch = useFactory((s) => s.batch);
  const appendConfigs = useFactory((s) => s.appendConfigs);
  const uniquenessEnabled = useFactory((s) => s.uniquenessEnabled);
  const candidates = useFactory((s) => s.candidatesPerBrand);
  const setState = useFactory.setState;
  const { t } = useT();

  const [text, setText] = useState(SAMPLE);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const brands = useMemo(() => parseBrands(text), [text]);

  const generate = async () => {
    if (!brands.length || running) return;
    setRunning(true);
    setProgress({ done: 0, total: brands.length });

    // Seed diversity with whatever is already in the batch when uniqueness is on.
    const accumulated: FaviconConfig[] = uniquenessEnabled ? batch.map((b) => b.config) : [];
    const CHUNK = 20;
    try {
      for (let i = 0; i < brands.length; i += CHUNK) {
        const chunk = brands.slice(i, i + CHUNK);
        const configs = generateDiverseBatch(config, chunk, {
          existing: accumulated,
          candidates: uniquenessEnabled ? candidates : 1,
        });
        accumulated.push(...configs);
        appendConfigs(configs);
        setProgress({ done: Math.min(i + CHUNK, brands.length), total: brands.length });
        await nextFrame(); // keep the UI responsive on large runs
      }
    } finally {
      setRunning(false);
    }
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-200">
        {t("bulk.title")}
      </h3>
      <p className="mb-2 text-[11px] text-neutral-500">{t("bulk.desc")}</p>
      <textarea
        className="input-base scroll-thin h-36 resize-none font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder={SAMPLE}
      />

      <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <Toggle
          label={t("bulk.antiSim")}
          checked={uniquenessEnabled}
          onChange={(v) => setState({ uniquenessEnabled: v })}
        />
        {uniquenessEnabled && (
          <Slider
            label={t("bulk.depth")}
            value={candidates}
            min={4}
            max={64}
            onChange={(v) => setState({ candidatesPerBrand: v })}
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="btn-primary flex-1 disabled:opacity-50" disabled={!brands.length || running} onClick={generate}>
          {running ? t("bulk.generating", { p: pct }) : t("bulk.generate", { n: brands.length })}
        </button>
      </div>

      {running && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-akuma-redBright transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
