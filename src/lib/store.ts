import { create } from "zustand";
import type { BatchItem, DesignLayer, FaviconConfig } from "@/lib/types";
import { defaultConfig, cloneConfig } from "@/lib/engine/defaults";
import { renderSVG } from "@/lib/engine/render";
import { renderLogoSVG } from "@/lib/engine/logo";
import { randomizeConfig, randomizeLogoConfig, randomBrandName, hashString } from "@/lib/engine/random";
import { signatureString, generateDiverseBatch } from "@/lib/engine/uniqueness";
import { PRESET_BY_ID } from "@/lib/engine/presets";

const HISTORY_CAP = 100;
const RECENT_CAP = 18;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeBatchItem(config: FaviconConfig, mode: "favicon" | "logo" = "favicon"): BatchItem {
  return {
    id: uid(),
    config: cloneConfig(config),
    mode,
    svg: mode === "logo" ? renderLogoSVG(config) : renderSVG(config),
    createdAt: Date.now(),
    signature: signatureString(config),
  };
}

export interface FactoryState {
  // ── Editor ──
  config: FaviconConfig;
  past: FaviconConfig[];
  future: FaviconConfig[];

  // ── Collections ──
  batch: BatchItem[];
  recentColors: string[];

  // ── Settings ──
  uniquenessEnabled: boolean;
  candidatesPerBrand: number;
  /** which design the editor is previewing/editing */
  editorMode: "favicon" | "logo";
  /** include 512² logos (SVG + WebP + PNG) in the export */
  includeLogos: boolean;
  /** UI language */
  lang: "ru" | "en";
  /** currently selected layer id */
  selectedLayerId: string | null;

  // ── Editor actions ──
  pushHistory: () => void;
  setConfig: (patch: Partial<FaviconConfig>) => void;
  setEffects: (patch: Partial<FaviconConfig["effects"]>) => void;
  replaceConfig: (config: FaviconConfig, recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  randomizeEditor: () => void;
  randomBrand: () => void;
  clearBrand: () => void;
  applyPreset: (id: string) => void;
  addRecentColor: (hex: string) => void;

  // ── Batch actions ──
  addToBatch: () => void;
  addLogoToBatch: () => void;
  duplicateBatch: (id: string) => void;
  deleteBatch: (id: string) => void;
  deleteSelected: () => void;
  clearBatch: () => void;
  clearBatchByMode: (mode: "favicon" | "logo") => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  loadBatchItemIntoEditor: (id: string) => void;
  updateBatchItem: (id: string, config: FaviconConfig) => void;

  // ── Bulk ──
  bulkGenerate: (brands: string[]) => number;
  /** Appends pre-generated configs (used by chunked bulk generation). */
  appendConfigs: (configs: FaviconConfig[]) => void;

  // ── Layer actions ──
  setSelectedLayer: (id: string | null) => void;
  addLayer: (layer: DesignLayer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<DesignLayer>) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
}

export const useFactory = create<FactoryState>((set, get) => ({
  config: defaultConfig(),
  past: [],
  future: [],
  batch: [],
  recentColors: [],
  uniquenessEnabled: true,
  candidatesPerBrand: 28,
  editorMode: "favicon",
  includeLogos: false,
  lang: "ru",
  selectedLayerId: null,

  pushHistory: () =>
    set((s) => ({
      past: [...s.past, cloneConfig(s.config)].slice(-HISTORY_CAP),
      future: [],
    })),

  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

  setEffects: (patch) =>
    set((s) => ({ config: { ...s.config, effects: { ...s.config.effects, ...patch } } })),

  replaceConfig: (config, recordHistory = true) =>
    set((s) => ({
      config: cloneConfig(config),
      ...(recordHistory ? { past: [...s.past, cloneConfig(s.config)].slice(-HISTORY_CAP), future: [] } : {}),
    })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        config: prev,
        past: s.past.slice(0, -1),
        future: [cloneConfig(s.config), ...s.future].slice(0, HISTORY_CAP),
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return {
        config: next,
        future: s.future.slice(1),
        past: [...s.past, cloneConfig(s.config)].slice(-HISTORY_CAP),
      };
    }),

  randomizeEditor: () => {
    const s = get();
    s.pushHistory();
    const seed = (hashString(s.config.brandName) + Date.now()) >>> 0;
    const next = randomizeConfig(s.config, seed);
    if (s.editorMode === "logo") {
      next.logo = randomizeLogoConfig(s.config.logo, seed);
    }
    set({ config: next });
  },

  randomBrand: () => {
    get().pushHistory();
    set((s) => ({ config: { ...s.config, brandName: randomBrandName(), text: "" } }));
  },

  clearBrand: () => {
    get().pushHistory();
    set((s) => ({ config: { ...s.config, brandName: "", text: "" } }));
  },

  applyPreset: (id) => {
    const preset = PRESET_BY_ID.get(id);
    if (!preset) return;
    const s = get();
    s.pushHistory();
    set((st) => ({ config: { ...st.config, ...preset.apply } }));
  },

  addRecentColor: (hex) =>
    set((s) => ({
      recentColors: [hex, ...s.recentColors.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, RECENT_CAP),
    })),

  addToBatch: () =>
    set((s) => ({ batch: [makeBatchItem(s.config, "favicon"), ...s.batch] })),

  addLogoToBatch: () =>
    set((s) => ({ batch: [makeBatchItem(s.config, "logo"), ...s.batch] })),

  duplicateBatch: (id) =>
    set((s) => {
      const item = s.batch.find((b) => b.id === id);
      if (!item) return s;
      const copy = makeBatchItem({ ...item.config, brandName: `${item.config.brandName} copy` });
      const idx = s.batch.findIndex((b) => b.id === id);
      const next = [...s.batch];
      next.splice(idx, 0, copy);
      return { batch: next };
    }),

  deleteBatch: (id) => set((s) => ({ batch: s.batch.filter((b) => b.id !== id) })),

  deleteSelected: () => set((s) => ({ batch: s.batch.filter((b) => !b.selected) })),

  clearBatch: () => set({ batch: [] }),

  clearBatchByMode: (mode: "favicon" | "logo") =>
    set((s) => ({ batch: s.batch.filter((b) => (b.mode ?? "favicon") !== mode) })),

  toggleSelect: (id) =>
    set((s) => ({ batch: s.batch.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b)) })),

  selectAll: (ids) => set((s) => ({ batch: s.batch.map((b) => (ids.includes(b.id) ? { ...b, selected: true } : b)) })),

  clearSelection: () => set((s) => ({ batch: s.batch.map((b) => ({ ...b, selected: false })) })),

  loadBatchItemIntoEditor: (id) => {
    const item = get().batch.find((b) => b.id === id);
    if (!item) return;
    get().replaceConfig(item.config, true);
  },

  updateBatchItem: (id, config) =>
    set((s) => ({
      batch: s.batch.map((b) =>
        b.id === id
          ? { ...b, config: cloneConfig(config), svg: b.mode === "logo" ? renderLogoSVG(config) : renderSVG(config), signature: signatureString(config) }
          : b,
      ),
    })),

  bulkGenerate: (brands) => {
    const s = get();
    const existing = s.uniquenessEnabled ? s.batch.map((b) => b.config) : [];
    const configs = generateDiverseBatch(s.config, brands, {
      existing,
      candidates: s.uniquenessEnabled ? s.candidatesPerBrand : 1,
    });
    const items = configs.map((c) => makeBatchItem(c, "favicon"));
    set((st) => ({ batch: [...items, ...st.batch] }));
    return items.length;
  },

  appendConfigs: (configs) =>
    set((s) => ({ batch: [...s.batch, ...configs.map((c) => makeBatchItem(c, "favicon"))] })),

  setSelectedLayer: (id) => set({ selectedLayerId: id }),

  addLayer: (layer) =>
    set((s) => {
      if (s.editorMode === "logo") {
        const logo = s.config.logo;
        return { config: { ...s.config, logo: { ...logo, extraLayers: [...(logo.extraLayers ?? []), layer] } }, selectedLayerId: layer.id };
      }
      return { config: { ...s.config, extraLayers: [...(s.config.extraLayers ?? []), layer] }, selectedLayerId: layer.id };
    }),

  removeLayer: (id) =>
    set((s) => {
      if (s.editorMode === "logo") {
        const logo = s.config.logo;
        return { config: { ...s.config, logo: { ...logo, extraLayers: (logo.extraLayers ?? []).filter((l) => l.id !== id) } }, selectedLayerId: null };
      }
      return { config: { ...s.config, extraLayers: (s.config.extraLayers ?? []).filter((l) => l.id !== id) }, selectedLayerId: null };
    }),

  updateLayer: (id, patch) =>
    set((s) => {
      const updateList = (list: DesignLayer[]) =>
        list.map((l) => (l.id === id ? ({ ...l, ...patch } as DesignLayer) : l));
      if (s.editorMode === "logo") {
        const logo = s.config.logo;
        return { config: { ...s.config, logo: { ...logo, extraLayers: updateList(logo.extraLayers ?? []) } } };
      }
      return { config: { ...s.config, extraLayers: updateList(s.config.extraLayers ?? []) } };
    }),

  moveLayerUp: (id) =>
    set((s) => {
      const reorder = (list: DesignLayer[]) => {
        const i = list.findIndex((l) => l.id === id);
        if (i <= 0) return list;
        const next = [...list];
        [next[i - 1], next[i]] = [next[i], next[i - 1]];
        return next;
      };
      if (s.editorMode === "logo") {
        const logo = s.config.logo;
        return { config: { ...s.config, logo: { ...logo, extraLayers: reorder(logo.extraLayers ?? []) } } };
      }
      return { config: { ...s.config, extraLayers: reorder(s.config.extraLayers ?? []) } };
    }),

  moveLayerDown: (id) =>
    set((s) => {
      const reorder = (list: DesignLayer[]) => {
        const i = list.findIndex((l) => l.id === id);
        if (i < 0 || i >= list.length - 1) return list;
        const next = [...list];
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        return next;
      };
      if (s.editorMode === "logo") {
        const logo = s.config.logo;
        return { config: { ...s.config, logo: { ...logo, extraLayers: reorder(logo.extraLayers ?? []) } } };
      }
      return { config: { ...s.config, extraLayers: reorder(s.config.extraLayers ?? []) } };
    }),
}));
