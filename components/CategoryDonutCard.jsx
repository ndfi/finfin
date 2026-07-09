"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatILS } from "@/lib/utils";
import { getCategoryMeta } from "@/lib/categoryMeta";

/**
 * CategoryDonutCard
 * -------------------------------------------------------------------------
 * White card: donut chart + legend list, split out from BalanceHeroCard so
 * each card has one clear job. Fixed pixel chart size (not %-based) so
 * Recharts' ResponsiveContainer always has something concrete to measure,
 * regardless of ancestor flex/grid context.
 * -------------------------------------------------------------------------
 */
export default function CategoryDonutCard({ byCategory, mergedMeta }) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value, ...getCategoryMeta(name, mergedMeta) }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-3xl bg-white p-[18px] card-shadow-soft">
      <h2 className="text-[13px] font-bold text-[var(--ink)]/55 mb-3.5">התפלגות לפי קטגוריה</h2>

      {data.length === 0 ? (
        <p className="text-center text-sm text-[var(--ink)]/45 py-6">עדיין אין הוצאות החודש</p>
      ) : (
        <div className="flex items-center gap-4.5">
          <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
            <ResponsiveContainer width={108} height={108}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={35} outerRadius={53} paddingAngle={2} strokeWidth={0}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="figure text-sm font-extrabold text-[var(--ink)]">{formatILS(total)}</span>
              <span className="text-[9px] text-[var(--ink)]/45">סה"כ</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {data.slice(0, 5).map((d) => {
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center justify-between text-[13px] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[var(--ink)] truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[var(--ink)]/40 text-[11px]">{pct}%</span>
                    <span className="figure font-bold text-[var(--ink)] text-xs">{formatILS(d.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
