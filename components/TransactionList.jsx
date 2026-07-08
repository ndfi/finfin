"use client";

import * as Icons from "lucide-react";
import { format, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { formatILS } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/categoryMeta";

/**
 * TransactionList
 * -------------------------------------------------------------------------
 * Groups this month's transactions by day (newest first) and renders each
 * as a row with a colored category icon, category + time badges, and a
 * signed amount. Recurring projections are visually distinguished with a
 * "צפוי" (expected) badge since they haven't actually been paid yet.
 *
 * Props:
 *  - items: monthlySummary.allItems (real transactions + active recurring
 *    projections) from buildMonthlySummary()
 *  - onEdit(transaction): called when a real (non-projected) row is tapped.
 *    Recurring projections have no Firestore doc `id`, so they render as
 *    plain (non-interactive) rows instead of being wired to onEdit.
 * -------------------------------------------------------------------------
 */
export default function TransactionList({ items, onEdit }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[var(--ink)]/12 p-8 text-center text-sm text-[var(--ink)]/45">
        אין עדיין תנועות החודש. אפשר להתחיל בצ'אט 👋
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Group consecutive items by calendar day
  const groups = [];
  for (const item of sorted) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(new Date(lastGroup.date), new Date(item.timestamp))) {
      lastGroup.items.push(item);
    } else {
      groups.push({ date: item.timestamp, items: [item] });
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const dayTotal = group.items.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
        return (
          <div key={gi}>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold text-[var(--ink)]/55">
                {format(new Date(group.date), "d בMMMM · EEEE", { locale: he })}
              </span>
              <span className={`text-xs font-bold ${dayTotal < 0 ? "text-[var(--coral)]" : "text-[var(--teal-deep)]"}`}>
                {dayTotal >= 0 ? "+" : ""}
                {formatILS(dayTotal)}
              </span>
            </div>

            <div className="space-y-2">
              {group.items.map((t, i) => {
                const meta = getCategoryMeta(t.category);
                const IconComp = Icons[meta.icon] || Icons.Wallet;
                const isIncome = t.type === "income";
                const editable = !t.isRecurringProjection && !!t.id;
                const Row = editable ? "button" : "div";

                return (
                  <Row
                    key={t.id || i}
                    onClick={editable ? () => onEdit?.(t) : undefined}
                    className={`w-full text-right flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 card-shadow-soft ${
                      editable ? "hover:shadow-md active:scale-[0.99] transition-all cursor-pointer" : ""
                    }`}
                  >
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.color + "1F" }}
                    >
                      <IconComp size={17} color={meta.color} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-[var(--ink)] truncate">
                        {t.description || t.category}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold bg-[var(--bg)] text-[var(--ink)]/60 rounded-full px-2 py-0.5">
                          {t.category}
                        </span>
                        {t.isRecurringProjection && (
                          <span className="text-[10px] font-semibold bg-[var(--gold)]/25 text-[var(--gold-deep)] rounded-full px-2 py-0.5">
                            צפוי
                          </span>
                        )}
                        <span className="text-[10.5px] text-[var(--ink)]/35">
                          {format(new Date(t.timestamp), "HH:mm")}
                        </span>
                      </div>
                    </div>

                    <span className={`figure text-sm font-extrabold whitespace-nowrap ${isIncome ? "text-[var(--teal-deep)]" : "text-[var(--coral)]"}`}>
                      {isIncome ? "+" : "-"}
                      {formatILS(t.amount)}
                    </span>
                  </Row>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
