"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatILS } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/categoryMeta";

/**
 * BalanceHeroCard
 * -------------------------------------------------------------------------
 * A two-part card: a gold->teal gradient band up top showing the month's
 * balance, and a plain white section below (no overlapping negative-margin
 * trick — that's what caused text to collide on narrow screens) with a
 * centered donut chart and a category legend.
 *
 * Layout notes for mobile:
 *  - The gradient band uses its own internal grid so the balance figure and
 *    the income/expense chips never compete for the same line.
 *  - The donut wrapper has a hard pixel height (not a %-based one) so
 *    Recharts' ResponsiveContainer always has something concrete to
 *    measure against, even inside nested flex/grid ancestors.
 * -------------------------------------------------------------------------
 */
export default function BalanceHeroCard({ summary, monthLabel }) {
  const data = Object.entries(summary.byCategory)
    .map(([name, value]) => ({ name, value, ...getCategoryMeta(name) }))
    .sort((a, b) => b.value - a.value);

  const total = summary.totalExpense;

  return (
    <div className="rounded-3xl overflow-hidden card-shadow bg-white">
      <div className="hero-gradient px-5 py-5 text-white">
        <p className="text-[13px] opacity-85">{monthLabel} · יתרה</p>
        <p className="figure text-[32px] leading-tight font-bold mt-1">{formatILS(summary.balance)}</p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-[11px] opacity-80">הכנסות</p>
            <p className="figure text-sm font-semibold mt-0.5">{formatILS(summary.totalIncome)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2">
            <p className="text-[11px] opacity-80">הוצאות</p>
            <p className="figure text-sm font-semibold mt-0.5">{formatILS(summary.totalExpense)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {data.length === 0 ? (
          <p className="text-center text-sm text-[var(--ink)]/50 py-6">עדיין אין הוצאות החודש</p>
        ) : (
          <>
            <p className="text-xs font-medium text-[var(--ink)]/50 mb-4">התפלגות לפי קטגוריה</p>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
                <ResponsiveContainer width={128} height={128}>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={62}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {data.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="figure text-sm font-bold text-[var(--ink)]">{formatILS(total)}</span>
                  <span className="text-[9px] text-[var(--ink)]/50">סה"כ</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                {data.slice(0, 5).map((d) => {
                  const pct = total ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[var(--ink)] truncate">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[var(--ink)]/45 text-xs">{pct}%</span>
                        <span className="figure font-medium text-[var(--ink)] text-xs">{formatILS(d.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
