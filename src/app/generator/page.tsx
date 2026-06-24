"use client";

import { useEffect } from "react";
import { useFactory } from "@/lib/store";
import { Header } from "@/components/generator/Header";
import { LeftPanel } from "@/components/generator/LeftPanel";
import { Editor } from "@/components/generator/Editor";
import { PreviewGrid } from "@/components/generator/PreviewGrid";
import { BatchQueue } from "@/components/generator/BatchQueue";
import { BulkMode } from "@/components/generator/BulkMode";
import { ExportPanel } from "@/components/generator/ExportPanel";
import { Analytics } from "@/components/generator/Analytics";
import { useHotkeys } from "@/components/generator/useHotkeys";
import { loadLang } from "@/lib/i18n";
import { ensureFontsLoaded } from "@/lib/engine/fonts";

export default function GeneratorPage() {
  useEffect(() => {
    useFactory.setState({ lang: loadLang() });
    void ensureFontsLoaded();
  }, []);

  useHotkeys();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <main className="grid flex-1 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[1fr_minmax(320px,420px)_320px]">
          {/* Редактор + превью */}
          <section className="scroll-thin flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="glass-card p-4">
              <Editor />
            </div>
            <PreviewGrid />
          </section>

          {/* Единый батч */}
          <section className="min-h-0 overflow-hidden">
            <BatchQueue />
          </section>

          {/* Правая панель */}
          <section className="scroll-thin flex flex-col gap-3 overflow-y-auto pr-1">
            <BulkMode />
            <ExportPanel />
            <Analytics />
          </section>
        </main>
      </div>
    </div>
  );
}
