"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatILS } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/categoryMeta";

/**
 * BalanceHeroCard
 * -------------------------------------------------------------------------
 * A two-part card: a gold->teal gradient band up top showing the month's
 * balance (income - expense), and a white lower section with a centered
 * donut chart (total spent) plus a legend list of categories with their
 * share of spending — modeled on the reference app's summary screen.
 * -------------------------------------------------------------------------
 */
export default function BalanceHeroCard({ summary, monthLabel }) {
  const data = Object.entries(summary.byCategory)
    .map(([name, value]) => ({ name, value, ...getCategoryMeta(name) }))
    .sort((a, b) => b.value - a.value);

  const total = summary.totalExpense;

  return (
    <div className="rounded-3xl overflow-hidden card-shadow">
      <div className="hero-gradient px-5 pt-5 pb-8 text-white">
        <p className="text-xs opacity-80">{monthLabel} · יתרה</p>
        <p className="figure text-3xl font-bold mt-0.5">{formatILS(summary.balance)}</p>
        <div className="flex gap-4 mt-2 text-xs opacity-90">
          <span>הכנסות {formatILS(summary.totalIncome)}</span>
          <span>הוצאות {formatILS(summary.totalExpense)}</span>
        </div>
      </div>

      <div className="bg-white px-5 pt-6 pb-5 -mt-4 rounded-t-3xl">
        {data.length === 0 ? (
          <p className="text-center text-sm text-[var(--ink)]/50 py-6">עדיין אין הוצאות החודש</p>
        ) : (
          <>
            <div className="relative w-40 h-40 mx-auto mb-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="figure text-lg font-bold text-[var(--ink)]">{formatILS(total)}</span>
                <span className="text-[10px] text-[var(--ink)]/50">סה"כ הוצאות</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.map((d) => {
                const pct = total ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[var(--ink)]">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ink)]/50 text-xs">{pct}%</span>
                      <span className="figure font-medium text-[var(--ink)]">{formatILS(d.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
