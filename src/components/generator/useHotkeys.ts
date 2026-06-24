"use client";

import { useEffect } from "react";
import { useFactory } from "@/lib/store";

/**
 * Global keyboard shortcuts. Disabled while typing in inputs/textareas so
 * they never hijack normal text editing.
 *   Ctrl+Z undo · Ctrl+Y / Ctrl+Shift+Z redo · Ctrl+D duplicate to batch
 *   Delete remove selected · Space randomize
 */
export function useHotkeys() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.tagName === "SELECT");
      const s = useFactory.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        s.redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.addToBatch();
      } else if (!typing && (e.key === "Delete" || e.key === "Backspace")) {
        if (s.batch.some((b) => b.selected)) {
          e.preventDefault();
          s.deleteSelected();
        }
      } else if (!typing && e.code === "Space") {
        e.preventDefault();
        s.randomizeEditor();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
