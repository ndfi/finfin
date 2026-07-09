"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Plus, Check } from "lucide-react";
import { CATEGORY_ICON_CHOICES, CATEGORY_COLOR_CHOICES } from "@/lib/categoryMeta";
import { addCategory } from "@/lib/hooks";

/**
 * CategoryPicker
 * -------------------------------------------------------------------------
 * Renders the circular icon grid for a given transaction type, plus a
 * dashed "+" tile that expands into a small inline form for creating a
 * brand new category on the spot — no separate settings screen needed.
 *
 * Props:
 *  - type: "expense" | "income" — which half of mergedMeta to show
 *  - mergedMeta: { expense: {...}, income: {...} } from mergeCategoryMeta()
 *  - selected: currently selected category name (or null)
 *  - onSelect(name): called when an existing category is tapped
 *  - onCreated(name): called after a new category is saved, so the caller
 *    can auto-select it
 *  - userId: passed through as `createdBy` on the new category doc
 * -------------------------------------------------------------------------
 */
export default function CategoryPicker({ type, mergedMeta, selected, onSelect, onCreated, userId }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0]);
  const [saving, setSaving] = useState(false);

  const categories = Object.entries(mergedMeta[type]);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await addCategory({ name: trimmed, type, icon, color, createdBy: userId ?? "unknown" });
      onCreated?.(trimmed);
      setCreating(false);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-2">
        {categories.map(([catName, meta]) => {
          const IconComp = Icons[meta.icon] || Icons.Wallet;
          const isSelected = selected === catName;
          return (
            <button key={catName} type="button" onClick={() => onSelect(catName)} className="flex flex-col items-center gap-1.5">
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                style={{
                  backgroundColor: isSelected ? meta.color : meta.color + "1A",
                  boxShadow: isSelected ? `0 0 0 3px ${meta.color}40` : "none",
                }}
              >
                <IconComp size={20} color={isSelected ? "#fff" : meta.color} />
              </span>
              <span className="text-[10px] text-[var(--ink)]/70 text-center leading-tight">{catName}</span>
            </button>
          );
        })}

        <button type="button" onClick={() => setCreating((v) => !v)} className="flex flex-col items-center gap-1.5">
          <span
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed transition-colors ${
              creating ? "border-[var(--teal)] text-[var(--teal)]" : "border-[var(--ink)]/20 text-[var(--ink)]/40"
            }`}
          >
            <Plus size={18} />
          </span>
          <span className="text-[10px] text-[var(--ink)]/50 text-center leading-tight">קטגוריה חדשה</span>
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl bg-[var(--bg)] p-3.5 mt-2 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם הקטגוריה (למשל: חיות מחמד)"
            dir="rtl"
            className="w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
          />

          <div>
            <p className="text-[11px] text-[var(--ink)]/50 mb-1.5">אייקון</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICON_CHOICES.map((iconName) => {
                const IconComp = Icons[iconName];
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isSelected ? color : color + "1A",
                      boxShadow: isSelected ? `0 0 0 2px ${color}50` : "none",
                    }}
                  >
                    <IconComp size={15} color={isSelected ? "#fff" : color} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[var(--ink)]/50 mb-1.5">צבע</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={13} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="w-full rounded-full bg-[var(--teal)] text-white py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-[var(--teal-deep)] transition-colors"
          >
            {saving ? "יוצר..." : "יצירת קטגוריה"}
          </button>
        </div>
      )}
    </div>
  );
}
