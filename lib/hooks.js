"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db, useAuth } from "./firebase";
import { getMonthRange } from "./utils";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

/* =============================================================================
 * TRANSACTIONS
 * ===========================================================================*/

/**
 * Real-time subscription to this month's transactions.
 * Schema: { amount, type: "expense"|"income", category, timestamp, description, createdBy }
 */
export function useMonthlyTransactions(referenceDate = new Date()) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { start, end } = getMonthRange(referenceDate);
    const q = query(
      collection(db, "transactions"),
      where("timestamp", ">=", Timestamp.fromDate(start)),
      where("timestamp", "<=", Timestamp.fromDate(end)),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTransactions(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("useMonthlyTransactions error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate.getMonth(), referenceDate.getFullYear()]);

  return { transactions, loading };
}

/**
 * One-shot fetch (via onSnapshot + immediate unsubscribe pattern is avoided —
 * instead we just subscribe per-month) for the last N months, used by the
 * 6-month income-vs-expense bar chart. Returns { "2026-02": {income, expense}, ... }
 */
export function useLastNMonthsSummary(n = 6) {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const ranges = Array.from({ length: n }, (_, i) => {
      const d = subMonths(now, n - 1 - i); // oldest -> newest
      return { date: d, start: startOfMonth(d), end: endOfMonth(d) };
    });

    let cancelled = false;
    const unsubscribers = [];
    const partial = {};

    ranges.forEach(({ date, start, end }) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const q = query(
        collection(db, "transactions"),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end))
      );
      const unsub = onSnapshot(q, (snap) => {
        let income = 0;
        let expense = 0;
        snap.docs.forEach((d) => {
          const t = d.data();
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        });
        partial[key] = { income, expense, label: date };
        if (!cancelled) setSummary({ ...partial });
      });
      unsubscribers.push(unsub);
    });

    setLoading(false);
    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
    };
  }, [n]);

  return { summary, loading };
}

/** Add a transaction. `type` param comes straight from the parser's output. */
export async function addTransaction({ amount, type, category, description, createdBy, fromRecurringId = null }) {
  return addDoc(collection(db, "transactions"), {
    amount,
    type,
    category,
    description,
    createdBy,
    fromRecurringId,
    timestamp: serverTimestamp(),
  });
}

export async function updateTransaction(id, patch) {
  return updateDoc(doc(db, "transactions", id), patch);
}

export async function deleteTransaction(id) {
  return deleteDoc(doc(db, "transactions", id));
}

/**
 * Delete every real transaction logged in the given month. Recurring items
 * are untouched (they're projections re-computed each month, not stored
 * per-month), so "reset" only clears manually-logged transactions —
 * exactly what "start this month over" should mean.
 * Uses a single Firestore batch (max 500 writes; a household month of
 * transactions will never come close).
 */
export async function resetMonthTransactions(referenceDate = new Date()) {
  const { start, end } = getMonthRange(referenceDate);
  const q = query(
    collection(db, "transactions"),
    where("timestamp", ">=", Timestamp.fromDate(start)),
    where("timestamp", "<=", Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

/* =============================================================================
 * BUDGETS
 * ===========================================================================*/

/** Schema: { categoryName, monthlyLimit, icon, color } */
export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "budgets"), orderBy("categoryName"));
    const unsub = onSnapshot(q, (snap) => {
      setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { budgets, loading };
}

export async function setBudget({ id, categoryName, monthlyLimit, icon, color }) {
  if (id) {
    return updateDoc(doc(db, "budgets", id), { categoryName, monthlyLimit, icon, color });
  }
  return addDoc(collection(db, "budgets"), { categoryName, monthlyLimit, icon, color });
}

export async function deleteBudget(id) {
  return deleteDoc(doc(db, "budgets", id));
}

/* =============================================================================
 * RECURRING TRANSACTIONS
 * ===========================================================================*/

/** Schema: { description, amount, type, category, dayOfMonth } */
export function useRecurring() {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "recurring"), orderBy("dayOfMonth"));
    const unsub = onSnapshot(q, (snap) => {
      setRecurring(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { recurring, loading };
}

export async function addRecurring({ description, amount, type, category, dayOfMonth }) {
  return addDoc(collection(db, "recurring"), { description, amount, type, category, dayOfMonth });
}

export async function updateRecurring(id, patch) {
  return updateDoc(doc(db, "recurring", id), patch);
}

export async function deleteRecurring(id) {
  return deleteDoc(doc(db, "recurring", id));
}

/**
 * Convenience: "commit" a recurring item into a real transaction for this
 * month (e.g. user says "שילמתי את השכירות" in chat). Pass the recurring
 * doc's id so `buildMonthlySummary` can de-duplicate the projection.
 */
export async function commitRecurringAsTransaction(recurringItem, createdBy) {
  return addTransaction({
    amount: recurringItem.amount,
    type: recurringItem.type,
    category: recurringItem.category,
    description: recurringItem.description,
    createdBy,
    fromRecurringId: recurringItem.id,
  });
}

/* =============================================================================
 * CATEGORIES (user-defined, on top of the built-in list in lib/categoryMeta.js)
 * ===========================================================================*/

/** Schema: { name, type: "expense"|"income", icon, color, createdBy } */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { categories, loading };
}

export async function addCategory({ name, type, icon, color, createdBy }) {
  return addDoc(collection(db, "categories"), { name, type, icon, color, createdBy });
}

export async function deleteCategory(id) {
  return deleteDoc(doc(db, "categories", id));
}

/* Re-export the auth hook here too, for a single import surface in components */
export { useAuth } from "./firebase";
