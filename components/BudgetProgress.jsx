"use client";

import * as Icons from "lucide-react";
import { Plus } from "lucide-react";
import { formatILS } from "@/lib/utils";

/**
 * BudgetProgress
 * -------------------------------------------------------------------------
 * Props:
 *  - budgets: [{ id, categoryName, monthlyLimit, icon, color }]
 *  - byCategory: { [categoryName]: spentAmount } — from buildMonthlySummary()
 *  - onEdit(budget): called when a budget card is tapped
 *  - onAddNew(): called when the trailing "+" card is tapped
 * -------------------------------------------------------------------------
 */
export default function BudgetProgress({ budgets, byCategory, onEdit, onAddNew }) {
  return (
    <div className="space-y-3">
      {budgets.map((b) => {
        const spent = byCategory[b.categoryName] || 0;
        const pct = Math.min(100, (spent / b.monthlyLimit) * 100);
        const over = spent > b.monthlyLimit;
        const IconComp = Icons[b.icon] || Icons.Wallet;

        return (
          <button
            key={b.id}
            onClick={() => onEdit?.(b)}
            className="w-full text-right rounded-2xl border border-[var(--ink)]/8 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                  style={{ backgroundColor: (over ? "var(--brick)" : b.color || "var(--teal)") + "1A" }}
                >
                  <IconComp size={17} color={over ? "var(--brick)" : b.color || "var(--teal)"} />
                </span>
                <span className="font-medium text-sm text-[var(--ink)]">{b.categoryName}</span>
              </div>
              <span className={"text-xs font-mono " + (over ? "text-[var(--brick)] font-semibold" : "text-[var(--ink)]/60")}>
                {formatILS(spent)} / {formatILS(b.monthlyLimit)}
              </span>
            </div>

            <div className="h-2.5 rounded-full bg-[var(--ink)]/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: over ? "var(--brick)" : b.color || "var(--teal)",
                }}
              />
            </div>

            {over && (
              <p className="mt-1.5 text-xs text-[var(--brick)]">
                חריגה של {formatILS(spent - b.monthlyLimit)} מהתקציב
              </p>
            )}
          </button>
        );
      })}

      <button
        onClick={onAddNew}
        className="w-full rounded-2xl border-2 border-dashed border-[var(--ink)]/15 p-4 flex items-center justify-center gap-2 text-sm text-[var(--ink)]/50 hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
      >
        <Plus size={16} />
        הוספת תקציב לקטגוריה
      </button>
    </div>
  );
}
