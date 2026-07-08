"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { X, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORY_META, INCOME_CATEGORY_META } from "@/lib/categoryMeta";
import { updateTransaction, deleteTransaction } from "@/lib/hooks";

/**
 * TransactionEditForm
 * -------------------------------------------------------------------------
 * Bottom-sheet overlay for editing or deleting a single, already-logged
 * transaction. Recurring projections (rent/salary auto-fills that haven't
 * actually been paid yet) never reach this component — TransactionList
 * only wires up onEdit for real Firestore-backed transactions, since a
 * projection has no doc `id` to update/delete.
 *
 * Props:
 *  - transaction: the transaction object being edited (has `id`)
 *  - onClose(): called after save/delete/cancel
 * -------------------------------------------------------------------------
 */
export default function TransactionEditForm({ transaction, onClose }) {
  const [type, setType] = useState(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description || "");
  const [saving, setSaving] = useState(false);

  const categoryMeta = type === "income" ? INCOME_CATEGORY_META : EXPENSE_CATEGORY_META;
  const categories = Object.entries(categoryMeta);

  function handleTypeSwitch(newType) {
    setType(newType);
    // If the current category doesn't exist under the new type, clear it
    // so the user picks a valid one instead of silently keeping a mismatch.
    const validForNewType = newType === "income" ? INCOME_CATEGORY_META : EXPENSE_CATEGORY_META;
    if (!validForNewType[category]) setCategory(null);
  }

  async function handleSave() {
    if (!category || !amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await updateTransaction(transaction.id, {
        type,
        category,
        amount: Number(amount),
        description: description.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("למחוק את התנועה הזו? הפעולה לא ניתנת לביטול.");
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[28px] p-5 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">עריכת תנועה</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg)]" aria-label="סגירה">
            <X size={16} />
          </button>
        </div>

        {/* Type switch */}
        <div className="flex gap-2 mb-4 bg-[var(--bg)] rounded-full p-1">
          <button
            onClick={() => handleTypeSwitch("expense")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              type === "expense" ? "bg-[var(--ink)] text-white" : "text-[var(--ink)]/50"
            }`}
          >
            הוצאה
          </button>
          <button
            onClick={() => handleTypeSwitch("income")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              type === "income" ? "bg-[var(--teal)] text-white" : "text-[var(--ink)]/50"
            }`}
          >
            הכנסה
          </button>
        </div>

        {/* Category picker */}
        <p className="text-xs text-[var(--ink)]/50 mb-2">קטגוריה</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
          {categories.map(([name, meta]) => {
            const IconComp = Icons[meta.icon] || Icons.Wallet;
            const selected = category === name;
            return (
              <button key={name} type="button" onClick={() => setCategory(name)} className="flex flex-col items-center gap-1.5">
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

        {/* Amount */}
        <label className="text-xs font-medium text-[var(--ink)]/70">סכום (₪)</label>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
        />

        {/* Description */}
        <label className="text-xs font-medium text-[var(--ink)]/70 mt-3 block">תיאור</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          dir="rtl"
          className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
        />

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={!category || !amount || saving}
            className="flex-1 rounded-full bg-[var(--teal)] text-white py-3 text-sm font-bold disabled:opacity-40 hover:bg-[var(--teal-deep)] transition-colors"
          >
            {saving ? "שומר..." : "שמירת שינויים"}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-[var(--coral)]/30 text-[var(--coral)] hover:bg-[var(--coral)]/5 transition-colors"
            aria-label="מחיקת תנועה"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
