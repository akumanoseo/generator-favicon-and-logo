"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Collapsible titled section used throughout the control panel. */
export function Section({
  title,
  icon,
  defaultOpen = true,
  right,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel-section">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-2">
          {right}
          <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-neutral-500">
            ▸
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  onBeforeChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  onBeforeChange?: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="field-label">{label}</span>
        <span className="font-mono text-xs text-neutral-400">
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onBeforeChange}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-0.5">
      <span className="text-sm text-neutral-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-akuma-red" : "bg-neutral-700"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
    </label>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
            value === o.value ? "bg-akuma-red text-white shadow-glow-sm" : "text-neutral-400 hover:text-neutral-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
