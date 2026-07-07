"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { EXPENSE_CATEGORY_META } from "@/lib/categoryMeta";
import { setBudget, deleteBudget } from "@/lib/hooks";

/**
 * BudgetForm
 * -------------------------------------------------------------------------
 * A small inline panel (not a full modal, keeps it mobile-friendly) for
 * creating or editing a per-category monthly budget goal. Category is
 * picked from a grid of colored circular icon buttons — matching the
 * "צור קטגוריות משלך" picker style from the reference app.
 *
 * Props:
 *  - existingBudgets: current budgets array, so we can hide categories that
 *    already have a goal set (and instead let the user tap one to edit it).
 *  - editingBudget: budget doc to edit, or null when creating new.
 *  - onClose: called after save/cancel/delete.
 * -------------------------------------------------------------------------
 */
export default function BudgetForm({ existingBudgets, editingBudget, onClose }) {
  const usedCategories = new Set(existingBudgets.map((b) => b.categoryName));
  const [category, setCategory] = useState(editingBudget?.categoryName || null);
  const [limit, setLimit] = useState(editingBudget?.monthlyLimit?.toString() || "");
  const [saving, setSaving] = useState(false);

  const availableCategories = Object.entries(EXPENSE_CATEGORY_META).filter(
    ([name]) => name === editingBudget?.categoryName || !usedCategories.has(name)
  );

  async function handleSave() {
    if (!category || !limit || Number(limit) <= 0) return;
    setSaving(true);
    const meta = EXPENSE_CATEGORY_META[category];
    try {
      await setBudget({
        id: editingBudget?.id,
        categoryName: category,
        monthlyLimit: Number(limit),
        icon: meta.icon,
        color: meta.color,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingBudget) return;
    setSaving(true);
    try {
      await deleteBudget(editingBudget.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-[var(--ink)]/10 p-5 shadow-sm">
      <h3 className="font-display font-bold text-base text-[var(--ink)] mb-4">
        {editingBudget ? "עריכת תקציב" : "הגדרת תקציב לקטגוריה חדשה"}
      </h3>

      <p className="text-xs text-[var(--ink)]/50 mb-2">בחר/י קטגוריה</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-5">
        {availableCategories.map(([name, meta]) => {
          const IconComp = Icons[meta.icon] || Icons.Wallet;
          const selected = category === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
                style={{
                  backgroundColor: selected ? meta.color : meta.color + "1A",
                  boxShadow: selected ? `0 0 0 3px ${meta.color}40` : "none",
                }}
              >
                <IconComp size={20} color={selected ? "#fff" : meta.color} />
              </span>
              <span className="text-[10px] text-[var(--ink)]/70 text-center leading-tight">{name}</span>
            </button>
          );
        })}
      </div>

      <label className="text-xs font-medium text-[var(--ink)]/70">תקציב חודשי (₪)</label>
      <input
        type="number"
        inputMode="decimal"
        min="1"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        placeholder="לדוגמה: 800"
        className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
      />

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSave}
          disabled={!category || !limit || saving}
          className="flex-1 rounded-xl bg-[var(--teal)] text-white py-2.5 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {saving ? "שומר..." : "שמירה"}
        </button>
        {editingBudget && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="rounded-xl border border-[var(--brick)]/30 text-[var(--brick)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--brick)]/5 transition-colors"
          >
            מחיקה
          </button>
        )}
        <button
          onClick={onClose}
          disabled={saving}
          className="rounded-xl border border-[var(--ink)]/15 text-[var(--ink)]/70 px-4 py-2.5 text-sm font-medium hover:bg-[var(--ink)]/5 transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
