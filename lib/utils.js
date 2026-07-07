/**
 * lib/utils.js
 * ---------------------------------------------------------------------------
 * Month-boundary helpers + the logic that "materializes" recurring
 * transactions (rent, subscriptions, salary) into the current month's
 * effective totals without needing a cron job or Cloud Function.
 *
 * Approach: recurring items are NOT copied into the `transactions`
 * collection automatically. Instead, every dashboard read merges:
 *   actual transactions (this month) + recurring items whose dayOfMonth
 *   has already passed (or all of them, if you want them counted as
 *   "committed" from day 1 — see `RECURRING_MODE` below).
 * This keeps the data model simple and avoids duplicate-entry bugs from
 * a cron running twice, while still letting the user log a recurring
 * expense as an actual transaction the day it's paid (e.g. rent auto-pay
 * triggers a bank notification -> they tell the chat "שילמתי 4500 שכירות",
 * which should replace the "projected" recurring line for that month).
 * ---------------------------------------------------------------------------
 */

import { startOfMonth, endOfMonth, getDate, format } from "date-fns";

// How recurring items count toward "spent so far":
// - "immediate": count the full recurring amount from day 1 of the month
//   (best for budgeting against known fixed costs)
// - "on-day": only count it once its dayOfMonth has passed
export const RECURRING_MODE = "immediate";

export function getMonthRange(date = new Date()) {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function monthKey(date = new Date()) {
  return format(date, "yyyy-MM"); // e.g. "2026-07" — handy for grouping/labels
}

export function monthLabelHebrew(date = new Date()) {
  const HEBREW_MONTHS = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Given the raw `recurring` docs, return the ones that should currently
 * count toward this month's totals, tagged so the UI can visually mark
 * them as "expected" vs. a real logged transaction.
 */
export function activeRecurringForMonth(recurringItems, referenceDate = new Date()) {
  const today = getDate(referenceDate);
  return recurringItems
    .filter((item) => RECURRING_MODE === "immediate" || item.dayOfMonth <= today)
    .map((item) => ({
      ...item,
      isRecurringProjection: true,
      // Give it a synthetic timestamp so it sorts naturally alongside real transactions
      timestamp: new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        item.dayOfMonth
      ),
    }));
}

/**
 * Merge real transactions with active recurring projections, and compute
 * the headline numbers the dashboard needs.
 *
 * NOTE: if a real transaction this month already has description/category
 * matching a recurring item (e.g. user manually logged "שילמתי שכירות"),
 * we skip that recurring projection to avoid double-counting. Matching is
 * done by category, which is intentionally loose — tighten it (e.g. match
 * by a `recurringId` field you stamp onto the manual transaction) if you
 * want stricter de-duplication.
 */
export function buildMonthlySummary(transactions, recurringItems, referenceDate = new Date()) {
  const recurringProjections = activeRecurringForMonth(recurringItems, referenceDate);

  const loggedCategories = new Set(
    transactions
      .filter((t) => t.fromRecurringId)
      .map((t) => t.fromRecurringId)
  );

  const effectiveRecurring = recurringProjections.filter(
    (r) => !loggedCategories.has(r.id)
  );

  const allItems = [...transactions, ...effectiveRecurring];

  const totalIncome = allItems
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = allItems
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const byCategory = {};
  for (const t of allItems.filter((t) => t.type === "expense")) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory, // { "סופרמרקט": 1240, "מסעדות": 380, ... }
    allItems,
  };
}

/** Formats a number as ILS currency, RTL-friendly. */
export function formatILS(amount) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
