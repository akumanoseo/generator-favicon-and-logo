"use client";

import { useState } from "react";
import { useFactory } from "@/lib/store";
import { Section, Slider, Toggle } from "@/components/ui/Controls";
import { ColorPicker } from "@/components/generator/ColorPicker";
import { FONTS } from "@/lib/engine/fonts";
import { GAMBLING_ICONS, ICON_CATEGORIES } from "@/lib/engine/icons";
import { defaultTextLayer, defaultShapeLayer, defaultIconLayer } from "@/lib/engine/layers";
import type { DesignLayer, TextDesignLayer, ShapeDesignLayer, IconDesignLayer, ShapeLayerKind } from "@/lib/types";
import { CANVAS } from "@/lib/types";
import { logoSize } from "@/lib/engine/logo";

const SHAPE_OPTIONS: { value: ShapeLayerKind; label: string }[] = [
  { value: "rect",     label: "Прямоугольник" },
  { value: "circle",   label: "Круг" },
  { value: "triangle", label: "Треугольник" },
  { value: "hexagon",  label: "Шестигранник" },
  { value: "diamond",  label: "Ромб" },
  { value: "star",     label: "Звезда" },
  { value: "pill",     label: "Таблетка" },
  { value: "line",     label: "Линия" },
  { value: "cross",    label: "Крест" },
];

type AddMode = "text" | "shape" | "icon" | null;

/** Row for a built-in (non-deletable) layer like favicon icon or wordmark */
function BuiltinLayerRow({
  label,
  icon,
  visible,
  onToggle,
}: {
  label: string;
  icon: string;
  visible: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 opacity-70">
      <button
        className="text-neutral-500 hover:text-white text-sm w-5 shrink-0"
        title="Видимость"
        onClick={() => onToggle(!visible)}
      >
        {visible ? "👁" : "🙈"}
      </button>
      <span className="text-base w-5 shrink-0 text-center">{icon}</span>
      <span className="flex-1 truncate text-xs text-neutral-400">{label}</span>
      <span className="text-[9px] text-neutral-600 italic">базовый</span>
    </div>
  );
}

export function LayersPanel() {
  const editorMode  = useFactory((s) => s.editorMode);
  const config      = useFactory((s) => s.config);
  const setConfig   = useFactory((s) => s.setConfig);
  const addLayer    = useFactory((s) => s.addLayer);
  const removeLayer = useFactory((s) => s.removeLayer);
  const updateLayer = useFactory((s) => s.updateLayer);
  const moveUp      = useFactory((s) => s.moveLayerUp);
  const moveDown    = useFactory((s) => s.moveLayerDown);
  const selectedId  = useFactory((s) => s.selectedLayerId);
  const setSelected = useFactory((s) => s.setSelectedLayer);

  const [addMode, setAddMode] = useState<AddMode>(null);
  const [iconCat, setIconCat] = useState("cards");

  const isLogo = editorMode === "logo";
  const lg = config.logo;

  const layers: DesignLayer[] = isLogo
    ? (lg?.extraLayers ?? [])
    : (config.extraLayers ?? []);

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  const canvasW = isLogo ? logoSize(lg?.layout ?? "horizontal").width : CANVAS;
  const canvasH = isLogo ? logoSize(lg?.layout ?? "horizontal").height : CANVAS;

  const handleAddText  = () => { addLayer(defaultTextLayer(canvasW, canvasH)); setAddMode(null); };
  const handleAddShape = (shape: ShapeLayerKind) => { addLayer(defaultShapeLayer(shape, canvasW, canvasH)); setAddMode(null); };
  const handleAddIcon  = (iconId: string) => { addLayer(defaultIconLayer(iconId, canvasW, canvasH)); setAddMode(null); };

  const upd = (id: string, patch: Partial<DesignLayer>) => updateLayer(id, patch);

  const patchLogo = (patch: Partial<typeof lg>) =>
    setConfig({ logo: { ...lg, ...patch } as typeof lg });

  return (
    <Section title="Слои" icon={<span>◻</span>} defaultOpen>

      {/* ── Add buttons ── */}
      <div className="flex gap-1 flex-wrap">
        {(["text", "shape", "icon"] as const).map((mode) => (
          <button
            key={mode}
            className={`btn-ghost btn-sm flex-1 ${addMode === mode ? "border-akuma-redBright text-akuma-redBright" : ""}`}
            onClick={() => setAddMode(addMode === mode ? null : mode)}
          >
            {mode === "text" ? "+ Текст" : mode === "shape" ? "+ Фигура" : "+ Иконка"}
          </button>
        ))}
      </div>

      {/* ── Add text ── */}
      {addMode === "text" && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <button className="btn-primary w-full text-sm" onClick={handleAddText}>Добавить текстовый слой</button>
        </div>
      )}

      {/* ── Add shape ── */}
      {addMode === "shape" && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <div className="grid grid-cols-3 gap-1">
            {SHAPE_OPTIONS.map((s) => (
              <button key={s.value} className="btn-ghost btn-sm text-xs" onClick={() => handleAddShape(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Add icon ── */}
      {addMode === "icon" && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-2 space-y-2">
          <div className="flex gap-1 flex-wrap">
            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setIconCat(cat.id)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                  iconCat === cat.id ? "bg-akuma-red text-white" : "text-neutral-400 hover:text-white border border-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {GAMBLING_ICONS.filter((ic) => ic.category === iconCat).map((ic) => (
              <button
                key={ic.id}
                title={ic.name}
                onClick={() => handleAddIcon(ic.id)}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 hover:border-akuma-redBright/60 hover:bg-akuma-red/10 transition flex flex-col items-center gap-0.5"
              >
                <svg viewBox={`0 0 ${ic.viewBox ?? 100} ${ic.viewBox ?? 100}`} width="32" height="32" fill="currentColor" stroke="currentColor" strokeWidth="0" className="text-neutral-200">
                  <g dangerouslySetInnerHTML={{ __html: ic.content }} />
                </svg>
                <span className="text-[9px] text-neutral-500 leading-tight text-center truncate w-full">{ic.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Layer list ── */}
      <div className="space-y-1">

        {/* User-added extra layers (rendered top = last in array) */}
        {layers.length === 0 && !isLogo && (
          <div className="text-center text-xs text-neutral-600 py-2">Нет слоёв — добавьте выше</div>
        )}

        {[...layers].reverse().map((layer, revIdx) => {
          const idx = layers.length - 1 - revIdx;
          const isSelected = layer.id === selectedId;
          const label =
            layer.kind === "text"  ? `Текст: "${(layer as TextDesignLayer).text.slice(0, 14)}"` :
            layer.kind === "shape" ? `Фигура: ${(layer as ShapeDesignLayer).shapeType}` :
                                     `Иконка: ${(layer as IconDesignLayer).iconId}`;
          return (
            <div
              key={layer.id}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 cursor-pointer transition ${
                isSelected
                  ? "border-akuma-redBright bg-akuma-red/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
              onClick={() => setSelected(isSelected ? null : layer.id)}
            >
              <button
                className="text-neutral-500 hover:text-white text-sm w-5 shrink-0"
                title="Видимость"
                onClick={(e) => { e.stopPropagation(); upd(layer.id, { visible: !layer.visible }); }}
              >
                {layer.visible ? "👁" : "🙈"}
              </button>
              <span className="flex-1 truncate text-xs text-neutral-300">{label}</span>
              <div className="flex gap-0.5 shrink-0">
                <button className="btn-ghost btn-sm text-[10px] px-1" title="Вверх"
                  onClick={(e) => { e.stopPropagation(); moveDown(layer.id); }}>↑</button>
                <button className="btn-ghost btn-sm text-[10px] px-1" title="Вниз"
                  onClick={(e) => { e.stopPropagation(); moveUp(layer.id); }}>↓</button>
                <button className="btn-ghost btn-sm text-[10px] px-1 text-red-400" title="Удалить"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>✕</button>
              </div>
            </div>
          );
        })}

        {/* Built-in logo layers at the bottom of the stack */}
        {isLogo && (
          <>
            <BuiltinLayerRow
              label="Вордмарк (текст)"
              icon="T"
              visible={lg?.showWordmark !== false}
              onToggle={(v) => patchLogo({ showWordmark: v })}
            />
            <BuiltinLayerRow
              label="Иконка фавиконки"
              icon="◼"
              visible={lg?.showFaviconIcon !== false}
              onToggle={(v) => patchLogo({ showFaviconIcon: v })}
            />
          </>
        )}
      </div>

      {/* ── Selected layer properties ── */}
      {selectedLayer && (
        <div className="rounded-lg border border-akuma-redBright/20 bg-black/30 p-3 space-y-2 mt-1">
          <div className="text-[10px] text-akuma-redBright uppercase tracking-wider font-semibold mb-2">Свойства слоя</div>

          <div className="grid grid-cols-2 gap-2">
            <Slider label="X" value={Math.round(selectedLayer.x)} min={-canvasW} max={canvasW * 2} unit="px"
              onChange={(v) => upd(selectedLayer.id, { x: v })} />
            <Slider label="Y" value={Math.round(selectedLayer.y)} min={-canvasH} max={canvasH * 2} unit="px"
              onChange={(v) => upd(selectedLayer.id, { y: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Slider label="Ш" value={Math.round(selectedLayer.width)} min={10} max={canvasW} unit="px"
              onChange={(v) => upd(selectedLayer.id, { width: v })} />
            <Slider label="В" value={Math.round(selectedLayer.height)} min={10} max={canvasH} unit="px"
              onChange={(v) => upd(selectedLayer.id, { height: v })} />
          </div>
          <Slider label="Поворот" value={selectedLayer.rotation} min={-180} max={180} unit="°"
            onChange={(v) => upd(selectedLayer.id, { rotation: v })} />
          <Slider label="Прозрачность" value={Math.round(selectedLayer.opacity * 100)} min={0} max={100} unit="%"
            onChange={(v) => upd(selectedLayer.id, { opacity: v / 100 })} />

          {selectedLayer.kind === "text"  && <TextLayerProps  layer={selectedLayer as TextDesignLayer}  upd={upd} />}
          {selectedLayer.kind === "shape" && <ShapeLayerProps layer={selectedLayer as ShapeDesignLayer} upd={upd} />}
          {selectedLayer.kind === "icon"  && <IconLayerProps  layer={selectedLayer as IconDesignLayer}  upd={upd} />}
        </div>
      )}
    </Section>
  );
}

// ── Sub-property panels ──────────────────────────────────────────────────────

function TextLayerProps({ layer, upd }: { layer: TextDesignLayer; upd: (id: string, p: Partial<DesignLayer>) => void }) {
  return (
    <>
      <div>
        <span className="field-label">Текст</span>
        <input
          className="input-base mt-1 w-full"
          value={layer.text}
          onChange={(e) => upd(layer.id, { text: e.target.value } as Partial<TextDesignLayer>)}
        />
      </div>
      <div>
        <span className="field-label">Шрифт</span>
        <div className="scroll-thin mt-1 grid max-h-32 grid-cols-2 gap-1 overflow-y-auto pr-1">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => upd(layer.id, { fontFamily: f.id } as Partial<TextDesignLayer>)}
              className={`rounded border px-2 py-1 text-left transition ${
                layer.fontFamily === f.id ? "border-akuma-redBright bg-akuma-red/15" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <span className="block text-sm leading-tight" style={{ fontFamily: f.family }}>Aa</span>
              <span className="block text-[9px] text-neutral-500 truncate">{f.name}</span>
            </button>
          ))}
        </div>
      </div>
      <Slider label="Размер" value={layer.fontSize} min={8} max={400} unit="px"
        onChange={(v) => upd(layer.id, { fontSize: v } as Partial<TextDesignLayer>)} />
      <Slider label="Насыщенность" value={layer.fontWeight} min={100} max={900} step={100}
        onChange={(v) => upd(layer.id, { fontWeight: v } as Partial<TextDesignLayer>)} />
      <Slider label="Трекинг" value={layer.letterSpacing} min={-10} max={60} unit="px"
        onChange={(v) => upd(layer.id, { letterSpacing: v } as Partial<TextDesignLayer>)} />
      <ColorPicker label="Цвет" compact value={layer.color}
        onChange={(c) => upd(layer.id, { color: c } as Partial<TextDesignLayer>)} />
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <Toggle label="Градиент"
          checked={layer.gradient?.enabled ?? false}
          onChange={(v) => upd(layer.id, { gradient: { ...layer.gradient, enabled: v } } as Partial<TextDesignLayer>)}
        />
        {layer.gradient?.enabled && (
          <div className="mt-2 space-y-1.5">
            <ColorPicker label="От" compact value={layer.gradient.from}
              onChange={(c) => upd(layer.id, { gradient: { ...layer.gradient, from: c } } as Partial<TextDesignLayer>)} />
            <ColorPicker label="До" compact value={layer.gradient.to}
              onChange={(c) => upd(layer.id, { gradient: { ...layer.gradient, to: c } } as Partial<TextDesignLayer>)} />
            <Slider label="Угол" value={layer.gradient.angle} min={0} max={360} unit="°"
              onChange={(v) => upd(layer.id, { gradient: { ...layer.gradient, angle: v } } as Partial<TextDesignLayer>)} />
          </div>
        )}
      </div>
    </>
  );
}

function ShapeLayerProps({ layer, upd }: { layer: ShapeDesignLayer; upd: (id: string, p: Partial<DesignLayer>) => void }) {
  return (
    <>
      <div>
        <span className="field-label">Форма</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {SHAPE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => upd(layer.id, { shapeType: s.value } as Partial<ShapeDesignLayer>)}
              className={`rounded border px-2 py-0.5 text-[10px] transition ${
                layer.shapeType === s.value
                  ? "border-akuma-redBright bg-akuma-red/15 text-white"
                  : "border-white/10 text-neutral-400 hover:border-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ColorPicker label="Заливка" compact value={layer.fill}
        onChange={(c) => upd(layer.id, { fill: c } as Partial<ShapeDesignLayer>)} />
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <Toggle label="Градиент"
          checked={layer.fillGradient?.enabled ?? false}
          onChange={(v) => upd(layer.id, { fillGradient: { ...layer.fillGradient, enabled: v } } as Partial<ShapeDesignLayer>)}
        />
        {layer.fillGradient?.enabled && (
          <div className="mt-2 space-y-1.5">
            <ColorPicker label="От" compact value={layer.fillGradient.from}
              onChange={(c) => upd(layer.id, { fillGradient: { ...layer.fillGradient, from: c } } as Partial<ShapeDesignLayer>)} />
            <ColorPicker label="До" compact value={layer.fillGradient.to}
              onChange={(c) => upd(layer.id, { fillGradient: { ...layer.fillGradient, to: c } } as Partial<ShapeDesignLayer>)} />
            <Slider label="Угол" value={layer.fillGradient.angle} min={0} max={360} unit="°"
              onChange={(v) => upd(layer.id, { fillGradient: { ...layer.fillGradient, angle: v } } as Partial<ShapeDesignLayer>)} />
          </div>
        )}
      </div>
      <ColorPicker label="Обводка" compact value={layer.stroke}
        onChange={(c) => upd(layer.id, { stroke: c } as Partial<ShapeDesignLayer>)} />
      <Slider label="Толщина обводки" value={layer.strokeWidth} min={0} max={40} unit="px"
        onChange={(v) => upd(layer.id, { strokeWidth: v } as Partial<ShapeDesignLayer>)} />
      {(layer.shapeType === "rect" || layer.shapeType === "pill") && (
        <Slider label="Скругление" value={layer.cornerRadius} min={0} max={200} unit="px"
          onChange={(v) => upd(layer.id, { cornerRadius: v } as Partial<ShapeDesignLayer>)} />
      )}
    </>
  );
}

function IconLayerProps({ layer, upd }: { layer: IconDesignLayer; upd: (id: string, p: Partial<DesignLayer>) => void }) {
  const [cat, setCat] = useState(GAMBLING_ICONS.find((i) => i.id === layer.iconId)?.category ?? "cards");
  return (
    <>
      <div>
        <span className="field-label">Иконка</span>
        <div className="flex gap-1 flex-wrap mt-1 mb-1.5">
          {ICON_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`rounded px-2 py-0.5 text-[9px] font-medium transition ${
                cat === c.id ? "bg-akuma-red text-white" : "text-neutral-400 border border-white/10 hover:text-white"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {GAMBLING_ICONS.filter((i) => i.category === cat).map((ic) => (
            <button
              key={ic.id}
              title={ic.name}
              onClick={() => upd(layer.id, { iconId: ic.id } as Partial<IconDesignLayer>)}
              className={`rounded border p-1 transition flex items-center justify-center ${
                layer.iconId === ic.id
                  ? "border-akuma-redBright bg-akuma-red/15"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <svg viewBox={`0 0 ${ic.viewBox ?? 100} ${ic.viewBox ?? 100}`} width="24" height="24" fill="currentColor" stroke="currentColor" strokeWidth="0" className="text-neutral-200">
                <g dangerouslySetInnerHTML={{ __html: ic.content }} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <ColorPicker label="Цвет" compact value={layer.fill}
        onChange={(c) => upd(layer.id, { fill: c } as Partial<IconDesignLayer>)} />
      <div className="rounded-lg border border-white/10 bg-black/20 p-2">
        <Toggle label="Градиент"
          checked={layer.fillGradient?.enabled ?? false}
          onChange={(v) => upd(layer.id, { fillGradient: { ...layer.fillGradient, enabled: v } } as Partial<IconDesignLayer>)}
        />
        {layer.fillGradient?.enabled && (
          <div className="mt-2 space-y-1.5">
            <ColorPicker label="От" compact value={layer.fillGradient.from}
              onChange={(c) => upd(layer.id, { fillGradient: { ...layer.fillGradient, from: c } } as Partial<IconDesignLayer>)} />
            <ColorPicker label="До" compact value={layer.fillGradient.to}
              onChange={(c) => upd(layer.id, { fillGradient: { ...layer.fillGradient, to: c } } as Partial<IconDesignLayer>)} />
            <Slider label="Угол" value={layer.fillGradient.angle} min={0} max={360} unit="°"
              onChange={(v) => upd(layer.id, { fillGradient: { ...layer.fillGradient, angle: v } } as Partial<IconDesignLayer>)} />
          </div>
        )}
      </div>
    </>
  );
}
