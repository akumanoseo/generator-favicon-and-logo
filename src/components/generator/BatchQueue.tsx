"use client";

import { useMemo, useState } from "react";
import { useFactory } from "@/lib/store";
import { resolveText } from "@/lib/engine/defaults";
import { getFont } from "@/lib/engine/fonts";
import { InlineSvg } from "@/components/ui/InlineSvg";
import type { BatchItem } from "@/lib/types";
import { useT } from "@/lib/i18n";

type SortKey = "newest" | "oldest" | "brand" | "font";

export function BatchQueue() {
  const batch = useFactory((s) => s.batch);
  const duplicateBatch = useFactory((s) => s.duplicateBatch);
  const deleteBatch = useFactory((s) => s.deleteBatch);
  const deleteSelected = useFactory((s) => s.deleteSelected);
  const clearBatchByMode = useFactory((s) => s.clearBatchByMode);
  const clearBatch = useFactory((s) => s.clearBatch);
  const toggleSelect = useFactory((s) => s.toggleSelect);
  const selectAll = useFactory((s) => s.selectAll);
  const clearSelection = useFactory((s) => s.clearSelection);
  const loadIntoEditor = useFactory((s) => s.loadBatchItemIntoEditor);
  const { t } = useT();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filter, setFilter] = useState<"all" | "favicon" | "logo">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = batch;

    if (filter !== "all") {
      list = list.filter((b) => (b.mode ?? "favicon") === filter);
    }
    if (q) {
      list = list.filter(
        (b) => b.config.brandName.toLowerCase().includes(q) || resolveText(b.config).toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "oldest": sorted.sort((a, b) => a.createdAt - b.createdAt); break;
      case "brand":  sorted.sort((a, b) => a.config.brandName.localeCompare(b.config.brandName)); break;
      case "font":   sorted.sort((a, b) => a.config.fontFamily.localeCompare(b.config.fontFamily)); break;
      default:       sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }, [batch, search, sort, filter]);

  const selectedCount = batch.filter((b) => b.selected).length;
  const allVisibleSelected = filtered.length > 0 && filtered.every((b) => b.selected);
  const faviconCount = batch.filter((b) => (b.mode ?? "favicon") === "favicon").length;
  const logoCount = batch.filter((b) => b.mode === "logo").length;

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden">
      {/* Шапка */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-neutral-200">
          {t("batch.title")}
          <span className="chip">{batch.length}</span>
          {selectedCount > 0 && (
            <span className="chip border-akuma-red/40 text-akuma-redBright">
              {t("batch.selected", { n: selectedCount })}
            </span>
          )}
        </h3>
      </div>

      {/* Счётчики по типу */}
      <div className="flex gap-1 border-b border-white/10 px-3 py-2">
        {(["all", "favicon", "logo"] as const).map((f) => {
          const label =
            f === "all" ? `Все (${batch.length})` :
            f === "favicon" ? `🖼️ ${faviconCount}` :
            `🔤 ${logoCount}`;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filter === f
                  ? "bg-akuma-red/20 text-akuma-redBright border border-akuma-red/40"
                  : "text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Поиск + сортировка */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <input
          className="input-base h-8 flex-1 min-w-[120px]"
          placeholder={t("batch.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-base h-8 w-auto text-xs" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="newest">{t("batch.newest")}</option>
          <option value="oldest">{t("batch.oldest")}</option>
          <option value="brand">{t("batch.brand")}</option>
          <option value="font">{t("batch.font")}</option>
        </select>
      </div>

      {/* Действия */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <button
          className="btn-ghost btn-sm"
          onClick={() => allVisibleSelected ? clearSelection() : selectAll(filtered.map((b) => b.id))}
        >
          {allVisibleSelected ? t("batch.deselect") : t("batch.selectAll")}
        </button>
        <button
          className="btn-ghost btn-sm disabled:opacity-40"
          disabled={selectedCount === 0}
          onClick={deleteSelected}
        >
          {t("batch.removeSelected")}
        </button>
        <button
          className="btn-ghost btn-sm disabled:opacity-40"
          disabled={batch.length === 0}
          onClick={clearBatch}
        >
          {t("batch.clearAll")}
        </button>
      </div>

      {/* Список */}
      <div className="scroll-thin grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-3">
        {filtered.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-neutral-500">
            <span className="mb-1 text-2xl">📭</span>
            {batch.length === 0 ? t("batch.empty") : t("batch.noMatch")}
          </div>
        )}
        {filtered.map((item) => (
          <BatchCard
            key={item.id}
            item={item}
            onEdit={() => loadIntoEditor(item.id)}
            onDuplicate={() => duplicateBatch(item.id)}
            onDelete={() => deleteBatch(item.id)}
            onToggle={() => toggleSelect(item.id)}
            editTitle={t("batch.edit")}
            duplicateTitle={t("batch.duplicate")}
            deleteTitle={t("project.delete")}
          />
        ))}
      </div>
    </div>
  );
}

function BatchCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  editTitle,
  duplicateTitle,
  deleteTitle,
}: {
  item: BatchItem;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
  editTitle: string;
  duplicateTitle: string;
  deleteTitle: string;
}) {
  const c = item.config;
  const isLogo = item.mode === "logo";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-2 transition ${
        item.selected ? "border-akuma-redBright bg-akuma-red/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}
    >
      <input type="checkbox" checked={Boolean(item.selected)} onChange={onToggle} className="accent-akuma-red" />

      {/* Превью */}
      <div className="relative shrink-0">
        <InlineSvg
          svg={item.svg}
          className={`border border-white/10 overflow-hidden ${
            isLogo ? "h-10 w-20 rounded" : "h-12 w-12 rounded-md"
          }`}
        />
        {/* Бейдж типа */}
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 px-1 text-[9px] leading-4 border border-white/10">
          {isLogo ? "🔤" : "🖼️"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-100">{c.brandName || "—"}</div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span className="font-mono">{resolveText(c)}</span>
          <span>·</span>
          <span className="truncate">{getFont(c.fontFamily).name}</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-white/10" style={{ background: c.bgColor }} title="bg" />
          <span className="h-3 w-3 rounded-sm border border-white/10" style={{ background: c.textColor }} title="text" />
          <span className="ml-1 text-[10px] text-neutral-600">{isLogo ? "логотип" : "фавиконка"}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <button className="btn-ghost btn-sm" title={editTitle} onClick={onEdit}>✏️</button>
        <button className="btn-ghost btn-sm" title={duplicateTitle} onClick={onDuplicate}>⧉</button>
        <button className="btn-ghost btn-sm" title={deleteTitle} onClick={onDelete}>🗑️</button>
      </div>
    </div>
  );
}
