"use client";

import { useState } from "react";
import {
  Wallet,
  LogOut,
  MessageCircle,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import { useAuth, login, logout } from "@/lib/firebase";
import {
  useMonthlyTransactions,
  useLastNMonthsSummary,
  useBudgets,
  useRecurring,
  resetMonthTransactions,
} from "@/lib/hooks";
import { buildMonthlySummary, monthLabelHebrew } from "@/lib/utils";
import ChatInterface from "@/components/ChatInterface";
import BudgetProgress from "@/components/BudgetProgress";
import BudgetForm from "@/components/BudgetForm";
import BalanceHeroCard from "@/components/BalanceHeroCard";
import { ExpensePieChart, IncomeExpenseBarChart } from "@/components/Charts";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenMessage text="טוען..." />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard user={user} />;
}

/* =============================================================================
 * LOGIN
 * ===========================================================================*/
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("שגיאה בהתחברות. בדוק/י את הפרטים ונסה/י שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl card-shadow p-6 space-y-4">
        <div className="text-center mb-2">
          <span className="hero-gradient inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2">
            <Wallet className="text-white" size={26} />
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">גבל'לי כספים</h1>
          <p className="text-sm text-[var(--ink)]/60 mt-1">ניהול תקציב משפחתי</p>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--ink)]/70">אימייל</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--ink)]/70">סיסמה</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            dir="ltr"
          />
        </div>

        {error && <p className="text-xs text-[var(--brick)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[var(--teal)] text-white py-2.5 text-sm font-medium hover:bg-[var(--teal-dark)] transition-colors disabled:opacity-60"
        >
          {busy ? "מתחבר/ת..." : "התחברות"}
        </button>
      </form>
    </div>
  );
}

/* =============================================================================
 * DASHBOARD
 * ===========================================================================*/
function Dashboard({ user }) {
  const [mobileTab, setMobileTab] = useState("dashboard"); // "dashboard" | "chat"
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [resetting, setResetting] = useState(false);

  const { transactions } = useMonthlyTransactions(referenceDate);
  const { recurring } = useRecurring();
  const { budgets } = useBudgets();
  const { summary: sixMonthSummary } = useLastNMonthsSummary(6);

  const monthlySummary = buildMonthlySummary(transactions, recurring, referenceDate);
  const isCurrentMonth =
    referenceDate.getMonth() === new Date().getMonth() && referenceDate.getFullYear() === new Date().getFullYear();

  function goToMonth(delta) {
    setReferenceDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function openAddBudget() {
    setEditingBudget(null);
    setBudgetFormOpen(true);
  }

  function openEditBudget(budget) {
    setEditingBudget(budget);
    setBudgetFormOpen(true);
  }

  async function handleResetMonth() {
    const confirmed = window.confirm(
      `לאפס את כל הנתונים של ${monthLabelHebrew(referenceDate)}? הפעולה תמחק את כל התנועות שנרשמו ידנית בחודש זה ולא ניתנת לביטול.`
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      await resetMonthTransactions(referenceDate);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="hero-gradient sticky top-0 z-10 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={20} />
          <h1 className="font-display font-bold text-base leading-tight">גבל'לי כספים</h1>
        </div>

        <div className="flex items-center gap-1 bg-white/15 rounded-full px-1 py-1">
          <button onClick={() => goToMonth(1)} className="p-1.5 rounded-full hover:bg-white/20" aria-label="חודש הבא">
            <ChevronRight size={16} />
          </button>
          <span className="text-xs font-medium px-1 min-w-[72px] text-center">{monthLabelHebrew(referenceDate)}</span>
          <button onClick={() => goToMonth(-1)} className="p-1.5 rounded-full hover:bg-white/20" aria-label="חודש קודם">
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetMonth}
            disabled={resetting}
            className="p-2 rounded-lg hover:bg-white/15 disabled:opacity-50"
            aria-label="איפוס נתוני החודש"
            title="איפוס נתוני החודש"
          >
            <RotateCcw size={17} />
          </button>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-white/15" aria-label="התנתקות">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {!isCurrentMonth && (
        <div className="bg-[var(--gold)]/15 text-[var(--gold-dark)] text-xs text-center py-1.5">
          מציג נתונים היסטוריים · <button onClick={() => setReferenceDate(new Date())} className="underline font-medium">חזרה לחודש הנוכחי</button>
        </div>
      )}

      {/* Mobile tab switcher (hidden on lg where both panels show side by side) */}
      <nav className="lg:hidden flex border-b border-[var(--ink)]/10 bg-white">
        <TabButton
          active={mobileTab === "dashboard"}
          onClick={() => setMobileTab("dashboard")}
          icon={LayoutDashboard}
          label="דשבורד"
        />
        <TabButton active={mobileTab === "chat"} onClick={() => setMobileTab("chat")} icon={MessageCircle} label="צ'אט" />
      </nav>

      <main className="flex-1 grid lg:grid-cols-[1fr_400px] gap-4 p-4 max-w-6xl mx-auto w-full">
        {/* Dashboard column */}
        <section className={`space-y-4 ${mobileTab === "chat" ? "hidden lg:block" : "block"}`}>
          <BalanceHeroCard summary={monthlySummary} monthLabel={monthLabelHebrew(referenceDate)} />

          <div className="grid md:grid-cols-2 gap-4">
            <ExpensePieChart byCategory={monthlySummary.byCategory} />
            <IncomeExpenseBarChart summary={sixMonthSummary} />
          </div>

          <div>
            <h2 className="font-display font-bold text-lg text-[var(--ink)] mb-3">תקציבים לפי קטגוריה</h2>
            {budgetFormOpen ? (
              <BudgetForm
                existingBudgets={budgets}
                editingBudget={editingBudget}
                onClose={() => setBudgetFormOpen(false)}
              />
            ) : (
              <BudgetProgress
                budgets={budgets}
                byCategory={monthlySummary.byCategory}
                onEdit={openEditBudget}
                onAddNew={openAddBudget}
              />
            )}
          </div>
        </section>

        {/* Chat column */}
        <section className={`h-[70vh] lg:h-[calc(100vh-6rem)] ${mobileTab === "dashboard" ? "hidden lg:block" : "block"}`}>
          <ChatInterface user={user} monthlySummary={monthlySummary} budgets={budgets} />
        </section>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-[var(--teal)] text-[var(--teal)]" : "border-transparent text-[var(--ink)]/50"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function FullScreenMessage({ text }) {
  return <div className="min-h-screen flex items-center justify-center text-[var(--ink)]/60 text-sm">{text}</div>;
}
