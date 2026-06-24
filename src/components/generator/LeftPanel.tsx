"use client";

import { useFactory } from "@/lib/store";
import { BrandSettings } from "@/components/generator/panels/BrandSettings";
import { TypographyPanel } from "@/components/generator/panels/TypographyPanel";
import { ColorPanel } from "@/components/generator/panels/ColorPanel";
import { BackgroundPanel } from "@/components/generator/panels/BackgroundPanel";
import { EffectsPanel } from "@/components/generator/panels/EffectsPanel";
import { LogoPanel } from "@/components/generator/panels/LogoPanel";
import { PresetsPanel } from "@/components/generator/panels/PresetsPanel";
import { LayersPanel } from "@/components/generator/panels/LayersPanel";
import { useT } from "@/lib/i18n";

export function LeftPanel() {
  const randomizeEditor = useFactory((s) => s.randomizeEditor);
  const undo = useFactory((s) => s.undo);
  const redo = useFactory((s) => s.redo);
  const canUndo = useFactory((s) => s.past.length > 0);
  const canRedo = useFactory((s) => s.future.length > 0);
  const editorMode = useFactory((s) => s.editorMode);
  const setEditorMode = (m: "favicon" | "logo") => useFactory.setState({ editorMode: m });
  const addToBatch = useFactory((s) => s.addToBatch);
  const addLogoToBatch = useFactory((s) => s.addLogoToBatch);
  const { t } = useT();

  const isFavicon = editorMode === "favicon";

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-white/10 bg-akuma-panel/60 backdrop-blur-xl">

      {/* ── Переключатель режима ── */}
      <div className="border-b border-white/10 p-3">
        <div className="mb-3 flex rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => setEditorMode("favicon")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              isFavicon
                ? "bg-akuma-red text-white shadow-lg"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="text-base">🖼️</span>
            Фавиконка
          </button>
          <button
            onClick={() => setEditorMode("logo")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              !isFavicon
                ? "bg-akuma-red text-white shadow-lg"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="text-base">🔤</span>
            Логотип
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-primary flex-1 text-sm"
            onClick={isFavicon ? addToBatch : addLogoToBatch}
          >
            {isFavicon ? "＋ В батч (фавиконка)" : "＋ В батч (логотип)"}
          </button>
          <button className="btn-ghost btn-sm" onClick={randomizeEditor} title={t("tool.randomize")}>
            🎲
          </button>
          <button className="btn-ghost btn-sm disabled:opacity-30" disabled={!canUndo} onClick={undo} title={t("tool.undo")}>
            ↶
          </button>
          <button className="btn-ghost btn-sm disabled:opacity-30" disabled={!canRedo} onClick={redo} title={t("tool.redo")}>
            ↷
          </button>
        </div>
      </div>

      {/* ── Настройки (меняются по режиму) ── */}
      <div className="scroll-thin flex-1 overflow-y-auto">
        {/* Общее для обоих режимов */}
        <BrandSettings />

        {isFavicon ? (
          /* ── Режим фавиконки ── */
          <>
            <TypographyPanel />
            <ColorPanel />
            <BackgroundPanel />
            <EffectsPanel />
            <LayersPanel />
            <PresetsPanel />
          </>
        ) : (
          /* ── Режим логотипа ── */
          <>
            <LogoPanel />
            <LayersPanel />
            <TypographyPanel />
            <ColorPanel />
            <BackgroundPanel />
            <EffectsPanel />
          </>
        )}
      </div>
    </aside>
  );
}
