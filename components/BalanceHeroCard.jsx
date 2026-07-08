"use client";

import { Plus } from "lucide-react";
import { formatILS } from "@/lib/utils";

/**
 * BalanceHeroCard
 * -------------------------------------------------------------------------
 * Solid-color balance card: big balance figure up top, then two stat pills
 * side by side — a light "income" pill and a dark "expense" pill, each with
 * its own quick-add button. This intentionally mirrors the reference app's
 * pattern (bold flat color, oversized numbers, a light and a dark card
 * side-by-side with pill CTAs) rather than the earlier diagonal-gradient
 * treatment, which read as flat/dated on a real device.
 *
 * Props:
 *  - summary: { totalIncome, totalExpense, balance } from buildMonthlySummary()
 *  - monthLabel: string
 *  - onQuickAdd(type): called with "income" | "expense" when a pill CTA is tapped
 *    (wire this to open the chat tab pre-focused, or a quick-add modal).
 * -------------------------------------------------------------------------
 */
export default function BalanceHeroCard({ summary, monthLabel, onQuickAdd }) {
  return (
    <div className="rounded-[28px] bg-[var(--teal)] text-white px-5 pt-5 pb-[22px] card-shadow">
      <p className="text-[12.5px] opacity-85">{monthLabel} · יתרה</p>
      <p className="figure text-[40px] leading-none font-extrabold mt-1 mb-4 tracking-tight">
        {formatILS(summary.balance)}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[18px] bg-white text-[var(--ink)] px-3.5 py-3 card-shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/55">הכנסות</p>
          <p className="figure text-lg font-extrabold mt-0.5">{formatILS(summary.totalIncome)}</p>
          <button
            onClick={() => onQuickAdd?.("income")}
            className="mt-2.5 w-full rounded-full bg-[var(--gold)] text-[var(--ink)] text-xs font-bold py-2.5 flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <Plus size={13} strokeWidth={3} />
            הכנסה חדשה
          </button>
        </div>

        <div className="rounded-[18px] bg-[var(--ink)] text-white px-3.5 py-3 card-shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">הוצאות</p>
          <p className="figure text-lg font-extrabold mt-0.5">{formatILS(summary.totalExpense)}</p>
          <button
            onClick={() => onQuickAdd?.("expense")}
            className="mt-2.5 w-full rounded-full bg-white/15 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-white/20"
          >
            <Plus size={13} strokeWidth={3} />
            הוצאה חדשה
          </button>
        </div>
      </div>
    </div>
  );
}
