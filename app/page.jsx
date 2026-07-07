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
import { IncomeExpenseBarChart } from "@/components/Charts";

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
            className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
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
            className="mt-1 w-full rounded-xl border border-[var(--ink)]/15 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            dir="ltr"
          />
        </div>

        {error && <p className="text-xs text-[var(--brick)]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[var(--teal)] text-white py-3.5 text-sm font-medium hover:bg-[var(--teal-dark)] active:scale-[0.98] transition-all disabled:opacity-60"
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
      {/* ------------------------------------------------------------------
          Header — two clear rows so nothing competes for space on narrow
          screens: brand + account actions on row 1, month switcher on row 2.
          All tappable icons are 40x40 with a visible background so they
          read as buttons, not decoration.
      ------------------------------------------------------------------ */}
      <header className="hero-gradient sticky top-0 z-20 text-white">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 shrink-0">
              <Wallet size={18} />
            </span>
            <h1 className="font-display font-bold text-[17px] truncate">גבל'לי כספים</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton onClick={handleResetMonth} disabled={resetting} label="איפוס נתוני החודש">
              <RotateCcw size={17} />
            </IconButton>
            <IconButton onClick={logout} label="התנתקות">
              <LogOut size={17} />
            </IconButton>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 px-4 pb-4">
          <IconButton onClick={() => goToMonth(1)} label="חודש הבא" small>
            <ChevronRight size={16} />
          </IconButton>
          <span className="text-sm font-medium px-3 min-w-[110px] text-center">{monthLabelHebrew(referenceDate)}</span>
          <IconButton onClick={() => goToMonth(-1)} label="חודש קודם" small>
            <ChevronLeft size={16} />
          </IconButton>
        </div>
      </header>

      {!isCurrentMonth && (
        <div className="bg-[var(--gold)]/15 text-[var(--gold-dark)] text-xs text-center py-2 px-4">
          מציג נתונים היסטוריים ·{" "}
          <button onClick={() => setReferenceDate(new Date())} className="underline font-medium">
            חזרה לחודש הנוכחי
          </button>
        </div>
      )}

      <main className="flex-1 grid lg:grid-cols-[1fr_400px] gap-4 p-4 pb-24 lg:pb-4 max-w-6xl mx-auto w-full">
        {/* Dashboard column */}
        <section className={`space-y-4 ${mobileTab === "chat" ? "hidden lg:block" : "block"}`}>
          <BalanceHeroCard summary={monthlySummary} monthLabel={monthLabelHebrew(referenceDate)} />

          <IncomeExpenseBarChart summary={sixMonthSummary} />

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
        <section className={`h-[calc(100vh-13rem)] lg:h-[calc(100vh-8rem)] ${mobileTab === "dashboard" ? "hidden lg:block" : "block"}`}>
          <ChatInterface user={user} monthlySummary={monthlySummary} budgets={budgets} />
        </section>
      </main>

      {/* ------------------------------------------------------------------
          Bottom tab bar (mobile only) — thumb-reachable primary nav instead
          of a top tab strip, with a floating pill indicator on the active
          tab and generous 56px-tall touch targets.
      ------------------------------------------------------------------ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-[var(--ink)]/8 px-4 pt-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
          <BottomTabButton
            active={mobileTab === "dashboard"}
            onClick={() => setMobileTab("dashboard")}
            icon={LayoutDashboard}
            label="דשבורד"
          />
          <BottomTabButton
            active={mobileTab === "chat"}
            onClick={() => setMobileTab("chat")}
            icon={MessageCircle}
            label="צ'אט"
          />
        </div>
      </nav>
    </div>
  );
}

function IconButton({ children, onClick, disabled, label, small }) {
  const size = small ? "w-9 h-9" : "w-10 h-10";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${size} flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

function BottomTabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-colors ${
        active ? "bg-[var(--teal)]/12 text-[var(--teal)]" : "text-[var(--ink)]/45"
      }`}
    >
      <Icon size={20} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function FullScreenMessage({ text }) {
  return <div className="min-h-screen flex items-center justify-center text-[var(--ink)]/60 text-sm">{text}</div>;
}
