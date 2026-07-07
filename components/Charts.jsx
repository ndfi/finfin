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
  "#2FA88C", // teal
  "#F0B429", // gold
  "#E0645C", // brick
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
    <div className="rounded-2xl border border-[var(--ink)]/10 bg-white p-4">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">התפלגות הוצאות לפי קטגוריה</h3>
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
 */
export function IncomeExpenseBarChart({ summary }) {
  const HEBREW_MONTHS_SHORT = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];

  const data = Object.entries(summary)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: `${HEBREW_MONTHS_SHORT[v.label.getMonth()]}`,
      הכנסות: v.income,
      הוצאות: v.expense,
    }));

  if (!data.length) {
    return <EmptyState text="אין עדיין מספיק נתונים היסטוריים" />;
  }

  return (
    <div className="rounded-2xl border border-[var(--ink)]/10 bg-white p-4">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">הכנסות מול הוצאות — 6 חודשים אחרונים</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
          <XAxis dataKey="month" tick={{ fontFamily: "var(--font-body)", fontSize: 12 }} reversed />
          <YAxis tick={{ fontFamily: "var(--font-body)", fontSize: 11 }} />
          <Tooltip
            formatter={(value) => formatILS(value)}
            contentStyle={{ direction: "rtl", fontFamily: "var(--font-body)", borderRadius: 8 }}
          />
          <Legend formatter={(value) => <span style={{ fontFamily: "var(--font-body)", fontSize: 12 }}>{value}</span>} />
          <Bar dataKey="הכנסות" fill="#2FA88C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="הוצאות" fill="#E0645C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--ink)]/20 p-8 text-center text-sm text-[var(--ink)]/50">
      {text}
    </div>
  );
}
