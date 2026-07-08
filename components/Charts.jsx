"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatILS } from "@/lib/utils";

const PALETTE = [
  "#05A67C", // teal
  "#FFC93C", // gold
  "#FF5A5A", // coral
  "#4A7FBF",
  "#9B6BD1",
  "#E0648C",
  "#3DBFB8",
  "#D89A12",
];

/**
 * ExpensePieChart
 * byCategory: { "סופרמרקט": 1240, "מסעדות": 380, ... }
 */
export function ExpensePieChart({ byCategory }) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (!data.length) {
    return <EmptyState text="עדיין אין הוצאות החודש להצגה בגרף" />;
  }

  return (
    <div className="rounded-3xl bg-white p-[18px] card-shadow-soft">
      <h3 className="text-[13px] font-bold text-[var(--ink)]/55 mb-3">התפלגות הוצאות לפי קטגוריה</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatILS(value), name]}
            contentStyle={{ direction: "rtl", fontFamily: "var(--font-body)", borderRadius: 8 }}
          />
          <Legend
            layout="horizontal"
            align="center"
            formatter={(value) => <span style={{ fontFamily: "var(--font-body)", fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * IncomeExpenseBarChart
 * summary: { "2026-02": { income, expense, label: Date }, ... } from useLastNMonthsSummary()
 *
 * Axis direction note: even inside an RTL page, time/numeric chart axes
 * conventionally still run chronologically left-to-right (this matches
 * how Hebrew banking/finance apps render charts — only text direction
 * flips, not plotted data). The data here is already sorted oldest-first;
 * previously an XAxis `reversed` prop flipped that, making the chart read
 * backwards (newest month on the left). That prop is intentionally
 * removed below. The value axis is moved to the right side, which reads
 * more naturally as the first thing encountered in an RTL layout.
 */
export function IncomeExpenseBarChart({ summary }) {
  const HEBREW_MONTHS_SHORT = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];

  const data = Object.entries(summary)
    .sort(([a], [b]) => a.localeCompare(b)) // oldest -> newest
    .map(([key, v]) => ({
      month: HEBREW_MONTHS_SHORT[v.label.getMonth()],
      הכנסות: v.income,
      הוצאות: v.expense,
    }));

  if (!data.length) {
    return <EmptyState text="אין עדיין מספיק נתונים היסטוריים" />;
  }

  return (
    <div className="rounded-3xl bg-white p-[18px] card-shadow-soft">
      <h3 className="text-[13px] font-bold text-[var(--ink)]/55 mb-3">הכנסות מול הוצאות — 6 חודשים אחרונים</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
          <XAxis dataKey="month" tick={{ fontFamily: "var(--font-body)", fontSize: 12 }} axisLine={{ stroke: "#00000014" }} tickLine={false} />
          <YAxis
            orientation="right"
            tick={{ fontFamily: "var(--font-body)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) => formatILS(value)}
            contentStyle={{ direction: "rtl", fontFamily: "var(--font-body)", borderRadius: 8 }}
            cursor={{ fill: "#00000006" }}
          />
          <Legend formatter={(value) => <span style={{ fontFamily: "var(--font-body)", fontSize: 12 }}>{value}</span>} />
          <Bar dataKey="הכנסות" fill="#05A67C" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="הוצאות" fill="#FF5A5A" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[var(--ink)]/15 p-8 text-center text-sm text-[var(--ink)]/45">
      {text}
    </div>
  );
}
