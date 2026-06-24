import { useFactory } from "@/lib/store";

export type Lang = "ru" | "en";

const LANG_KEY = "akuma-favicon-factory:lang";

export function loadLang(): Lang {
  if (typeof window === "undefined") return "ru";
  const v = localStorage.getItem(LANG_KEY);
  return v === "en" || v === "ru" ? v : "ru";
}

export function persistLang(lang: Lang): void {
  if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, lang);
}

type Entry = { ru: string; en: string };

/** Flat translation dictionary. Keys are dotted by area. */
export const T: Record<string, Entry> = {
  // Header / project bar
  "nav.home": { ru: "← Главная", en: "← Home" },
  "header.title": { ru: "Йоба генератор фавиконок", en: "Yoba favicon generator" },
  "header.by": { ru: "от Akuma no SEO", en: "by Akuma no SEO" },
  "project.namePlaceholder": { ru: "Название проекта", en: "Project name" },
  "project.save": { ru: "💾 Сохранить", en: "💾 Save" },
  "project.saving": { ru: "Сохранение…", en: "Saving…" },
  "project.saveAs": { ru: "Сохранить как", en: "Save as" },
  "project.projects": { ru: "📂 Проекты", en: "📂 Projects" },
  "project.new": { ru: "＋ Новый", en: "＋ New" },
  "project.unsaved": { ru: "● Не сохранено", en: "● Unsaved" },
  "project.saved": { ru: "● Сохранено", en: "● Saved" },
  "project.empty": { ru: "Пока нет сохранённых проектов.", en: "No saved projects yet." },
  "project.faviconsCount": { ru: "{n} фавиконок", en: "{n} favicons" },
  "project.delete": { ru: "Удалить", en: "Delete" },

  // Left panel toolbar
  "tool.randomize": { ru: "🎲 Случайно", en: "🎲 Randomize" },
  "tool.undo": { ru: "Отменить (Ctrl+Z)", en: "Undo (Ctrl+Z)" },
  "tool.redo": { ru: "Повторить (Ctrl+Y)", en: "Redo (Ctrl+Y)" },

  // Brand
  "brand.title": { ru: "Бренд", en: "Brand" },
  "brand.name": { ru: "Название бренда", en: "Brand name" },
  "brand.text": { ru: "Текст на фавиконке", en: "Text on favicon" },
  "brand.autoText": { ru: 'Авто → "{v}"', en: 'Auto → "{v}"' },
  "brand.hint": { ru: "Пусто = первые 1–2 буквы бренда. Отрисовка:", en: "Empty = first 1–2 letters of the brand. Rendered as" },
  "brand.uppercase": { ru: "Авто-заглавные", en: "Auto-uppercase" },
  "brand.random": { ru: "🎲 Случайный бренд", en: "🎲 Random brand" },
  "brand.clear": { ru: "✕ Очистить", en: "✕ Clear" },

  // Typography
  "typo.title": { ru: "Типографика", en: "Typography" },
  "typo.font": { ru: "Шрифт", en: "Font family" },
  "typo.size": { ru: "Размер шрифта", en: "Font size" },
  "typo.weight": { ru: "Насыщенность", en: "Font weight" },
  "typo.letter": { ru: "Межбуквенный интервал", en: "Letter spacing" },
  "typo.line": { ru: "Высота строки", en: "Line height" },
  "typo.rotation": { ru: "Поворот", en: "Rotation" },
  "typo.italic": { ru: "Наклон (курсив)", en: "Italic angle" },
  "typo.offsetX": { ru: "Смещение X", en: "X offset" },
  "typo.offsetY": { ru: "Смещение Y", en: "Y offset" },
  "typo.halign": { ru: "Гор. выравнивание", en: "Horizontal align" },
  "typo.valign": { ru: "Верт. выравнивание", en: "Vertical align" },
  "align.left": { ru: "Слева", en: "Left" },
  "align.center": { ru: "Центр", en: "Center" },
  "align.right": { ru: "Справа", en: "Right" },
  "align.top": { ru: "Сверху", en: "Top" },
  "align.middle": { ru: "Середина", en: "Middle" },
  "align.bottom": { ru: "Снизу", en: "Bottom" },

  // Color
  "color.title": { ru: "Цвет текста", en: "Text color" },
  "color.color": { ru: "Цвет", en: "Color" },
  "color.gradientText": { ru: "Градиентный текст", en: "Gradient text" },
  "color.from": { ru: "От", en: "From" },
  "color.to": { ru: "До", en: "To" },
  "color.angle": { ru: "Угол", en: "Angle" },
  "color.recent": { ru: "Недавние", en: "Recent" },
  "color.randomTitle": { ru: "Случайный цвет", en: "Random color" },
  "color.pickTitle": { ru: "Взять с экрана", en: "Pick from screen" },

  // Background
  "bg.title": { ru: "Фон", en: "Background" },
  "bg.shape": { ru: "Форма", en: "Shape" },
  "shape.square": { ru: "Квадрат", en: "Square" },
  "shape.rounded": { ru: "Скругл.", en: "Rounded" },
  "shape.circle": { ru: "Круг", en: "Circle" },
  "shape.squircle": { ru: "Сквиркл", en: "Squircle" },
  "shape.hexagon": { ru: "Шестиуг.", en: "Hexagon" },
  "shape.none": { ru: "Без фона", en: "None" },
  "bg.corner": { ru: "Радиус углов", en: "Corner radius" },
  "bg.padding": { ru: "Отступ", en: "Padding" },
  "bg.fill": { ru: "Цвет заливки", en: "Fill color" },
  "bg.opacity": { ru: "Прозрачность", en: "Opacity" },
  "bg.gradient": { ru: "Градиентный фон", en: "Gradient background" },
  "bg.border": { ru: "Толщина рамки", en: "Border width" },
  "bg.borderColor": { ru: "Цвет рамки", en: "Border color" },
  "bg.shadow": { ru: "Тень", en: "Drop shadow" },
  "bg.glow": { ru: "Свечение", en: "Glow" },
  "bg.glowColor": { ru: "Цвет свечения", en: "Glow color" },

  // Effects
  "fx.title": { ru: "Эффекты", en: "Effects" },
  "fx.textShadow": { ru: "Тень текста", en: "Text shadow" },
  "fx.glow": { ru: "Свечение", en: "Glow" },
  "fx.neon": { ru: "Неон", en: "Neon" },
  "fx.innerShadow": { ru: "Внутр. тень", en: "Inner shadow" },
  "fx.outerShadow": { ru: "Внеш. тень", en: "Outer shadow" },
  "fx.metallic": { ru: "Металлик", en: "Metallic" },
  "fx.glass": { ru: "Стекло", en: "Glass" },
  "fx.noise": { ru: "Текстура шума", en: "Noise texture" },
  "fx.blur": { ru: "Размытие", en: "Blur" },
  "fx.hint": { ru: "Все эффекты рендерятся в реальном времени через нативные SVG-фильтры.", en: "All effects render in realtime via native SVG filters." },

  // Logo
  "logo.title": { ru: "Логотип", en: "Logo" },
  "logo.desc": { ru: "Превращает иконку фавиконки в полноценный логотип (иконка + вордмарк). Логотипы 512×512 (SVG + WebP + PNG) можно включить в экспорт.", en: "Turns the favicon icon into a full logo (icon + wordmark). 512×512 logos (SVG + WebP + PNG) can be added to the export." },
  "logo.preview": { ru: "👁 Предпросмотр логотипа в редакторе", en: "👁 Preview logo in the editor" },
  "logo.layout": { ru: "Раскладка", en: "Layout" },
  "logo.horizontal": { ru: "Горизонт.", en: "Horizontal" },
  "logo.stacked": { ru: "Стопкой", en: "Stacked" },
  "logo.showWordmark": { ru: "Показывать вордмарк", en: "Show wordmark" },
  "logo.wordmarkText": { ru: "Текст вордмарка", en: "Wordmark text" },
  "logo.wordmarkAuto": { ru: 'Авто → "{v}"', en: 'Auto → "{v}"' },
  "logo.wordmarkColor": { ru: "Цвет вордмарка", en: "Wordmark color" },
  "logo.wordmarkFont": { ru: "Шрифт вордмарка", en: "Wordmark font" },
  "logo.sameFont": { ru: "Как у фавиконки ({v})", en: "Same as favicon ({v})" },
  "logo.bg": { ru: "Фон логотипа", en: "Logo background" },
  "logo.bgColor": { ru: "Цвет фона", en: "Background color" },

  // Presets
  "presets.title": { ru: "Шаблоны", en: "Templates" },

  // Editor
  "editor.title": { ru: "Редактор", en: "Editor" },
  "editor.favicon": { ru: "Фавиконка", en: "Favicon" },
  "editor.logo": { ru: "Логотип", en: "Logo" },
  "editor.reset": { ru: "Сброс", en: "Reset" },
  "editor.hint": { ru: "Тяни текст · колесо — масштаб · Ctrl+колесо — зум · тяни фон — панорама", en: "Drag text · wheel to scale · Ctrl+wheel to zoom · drag background to pan" },

  // Preview
  "preview.title": { ru: "Живое превью", en: "Live preview" },
  "preview.dark": { ru: "Тёмный", en: "Dark" },
  "preview.light": { ru: "Светлый", en: "Light" },
  "preview.transparent": { ru: "Прозрачный", en: "Transparent" },

  // Batch
  "batch.title": { ru: "Очередь батча", en: "Batch queue" },
  "batch.add": { ru: "＋ В батч", en: "＋ Add to batch" },
  "batch.addTitle": { ru: "Добавить текущий дизайн в батч", en: "Add current editor design to the batch" },
  "batch.search": { ru: "Поиск бренд / текст…", en: "Search brand / text…" },
  "batch.newest": { ru: "Новые", en: "Newest" },
  "batch.oldest": { ru: "Старые", en: "Oldest" },
  "batch.brand": { ru: "Бренд А–Я", en: "Brand A–Z" },
  "batch.font": { ru: "Шрифт", en: "Font" },
  "batch.selectAll": { ru: "Выбрать все", en: "Select all" },
  "batch.deselect": { ru: "Снять выбор", en: "Deselect" },
  "batch.removeSelected": { ru: "Удалить выбранные", en: "Remove selected" },
  "batch.clearAll": { ru: "Очистить всё", en: "Clear all" },
  "batch.selected": { ru: "{n} выбрано", en: "{n} selected" },
  "batch.empty": { ru: "Батч пуст — создайте дизайн и «В батч», или используйте Bulk-режим.", en: "Batch is empty — design one and “Add to batch”, or use Bulk mode." },
  "batch.noMatch": { ru: "Ничего не найдено.", en: "No matches for your search." },
  "batch.edit": { ru: "Редактировать", en: "Edit" },
  "batch.duplicate": { ru: "Дублировать", en: "Duplicate" },

  // Bulk
  "bulk.title": { ru: "⚡ Массовая генерация", en: "⚡ Bulk generation" },
  "bulk.desc": { ru: "Один бренд на строку. Каждый получает визуально уникальную фавиконку — цвета, формы, шрифты, градиенты, эффекты и раскладка комбинируются для максимального разнообразия.", en: "One brand per line. Each gets a visually unique favicon — colors, shapes, fonts, gradients, effects and layout are combined to maximize diversity." },
  "bulk.antiSim": { ru: "Движок анти-схожести", en: "Anti-similarity engine" },
  "bulk.depth": { ru: "Глубина поиска разнообразия", en: "Diversity search depth" },
  "bulk.generate": { ru: "Сгенерировать {n}", en: "Generate {n}" },
  "bulk.generating": { ru: "Генерация… {p}%", en: "Generating… {p}%" },

  // Export
  "export.title": { ru: "📦 Экспорт", en: "📦 Export" },
  "export.scopeBatch": { ru: "Батч ({n})", en: "Batch ({n})" },
  "export.scopeSelected": { ru: "Выбрано ({n})", en: "Selected ({n})" },
  "export.scopeCurrent": { ru: "Текущий", en: "Current" },
  "export.formats": { ru: "Форматы", en: "Formats" },
  "export.aux": { ru: "Манифест и сниппеты", en: "Manifest & snippets" },
  "export.resolutions": { ru: "Разрешения (PNG / WebP)", en: "Resolutions (PNG / WebP)" },
  "export.selectAll": { ru: "Выбрать все", en: "Select all" },
  "export.clearAll": { ru: "Снять все", en: "Clear all" },
  "export.logos": { ru: "Логотипы 512² вместе с фавиконками", en: "512² logos alongside favicons" },
  "export.summary": { ru: "{n} шт · конвейер Canvas → Sharp → ZIP", en: "{n} items · pipeline Canvas → Sharp → ZIP" },
  "export.run": { ru: "⬇ Экспорт {n} в ZIP", en: "⬇ Export {n} as ZIP" },
  "export.nothing": { ru: "Выберите хотя бы один формат/разрешение.", en: "Select at least one format/resolution." },
  "export.progRaster": { ru: "Рендер мастеров {done}/{total}", en: "Rendering masters {done}/{total}" },
  "export.progPack": { ru: "Упаковка на сервере (Sharp + ICO + ZIP)…", en: "Packaging on server (Sharp + ICO + ZIP)…" },
  "export.progDownload": { ru: "Получение архива…", en: "Receiving archive…" },
  "export.progDone": { ru: "Экспорт завершён", en: "Export complete" },

  // Analytics
  "stats.title": { ru: "📊 Аналитика батча", en: "📊 Batch analytics" },
  "stats.total": { ru: "Всего", en: "Total" },
  "stats.unique": { ru: "Уникальных", en: "Unique" },
  "stats.duplicates": { ru: "Дубликатов", en: "Duplicates" },
  "stats.diversity": { ru: "Оценка визуального разнообразия", en: "Visual diversity score" },
  "stats.topFonts": { ru: "Топ шрифтов", en: "Top fonts" },
  "stats.shapes": { ru: "Формы", en: "Shapes" },

  // Language switch
  "lang.label": { ru: "Язык", en: "Language" },
};

/** Replaces {key} placeholders. */
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = T[key];
  if (!entry) return key;
  return interpolate(entry[lang], vars);
}

/** Hook: returns a `t(key, vars?)` bound to the current UI language. */
export function useT() {
  const lang = useFactory((s) => s.lang);
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  return { t, lang };
}
