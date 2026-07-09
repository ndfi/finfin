"use client";

import { useState } from "react";
import { setBudget, deleteBudget } from "@/lib/hooks";
import { getCategoryMeta } from "@/lib/categoryMeta";
import CategoryPicker from "@/components/CategoryPicker";

/**
 * BudgetForm
 * -------------------------------------------------------------------------
 * A small inline panel (not a full modal, keeps it mobile-friendly) for
 * creating or editing a per-category monthly budget goal. Category is
 * picked via the shared CategoryPicker, which also lets the user create a
 * brand new category on the spot if none of the existing ones fit.
 *
 * Props:
 *  - existingBudgets: current budgets array, so we can hide categories that
 *    already have a goal set (and instead let the user tap one to edit it).
 *  - editingBudget: budget doc to edit, or null when creating new.
 *  - mergedMeta: { expense, income } from mergeCategoryMeta() — built-in +
 *    custom categories combined.
 *  - userId: passed through to CategoryPicker for `createdBy` on new categories.
 *  - onClose: called after save/cancel/delete.
 * -------------------------------------------------------------------------
 */
export default function BudgetForm({ existingBudgets, editingBudget, mergedMeta, userId, onClose }) {
  const usedCategories = new Set(existingBudgets.map((b) => b.categoryName));
  const [category, setCategory] = useState(editingBudget?.categoryName || null);
  const [limit, setLimit] = useState(editingBudget?.monthlyLimit?.toString() || "");
  const [saving, setSaving] = useState(false);

  // Budgets only apply to expense categories, and hide ones that already
  // have a budget (unless it's the one currently being edited).
  const availableExpenseMeta = Object.fromEntries(
    Object.entries(mergedMeta.expense).filter(
      ([name]) => name === editingBudget?.categoryName || !usedCategories.has(name)
    )
  );
  const filteredMergedMeta = { expense: availableExpenseMeta, income: {} };

  async function handleSave() {
    if (!category || !limit || Number(limit) <= 0) return;
    setSaving(true);
    const meta = getCategoryMeta(category, mergedMeta);
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
      <div className="mb-5">
        <CategoryPicker
          type="expense"
          mergedMeta={filteredMergedMeta}
          selected={category}
          onSelect={setCategory}
          onCreated={setCategory}
          userId={userId}
        />
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
            className="rounded-xl border border-[var(--coral)]/30 text-[var(--coral)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--coral)]/5 transition-colors"
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
