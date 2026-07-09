"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Receipt, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { parseHebrewMessage } from "@/lib/parser";
import { addTransaction } from "@/lib/hooks";
import { formatILS } from "@/lib/utils";

/**
 * ChatInterface
 * -------------------------------------------------------------------------
 * Props:
 *  - user: firebase auth user (for createdBy)
 *  - monthlySummary: { totalIncome, totalExpense, byCategory } from buildMonthlySummary()
 *  - budgets: array of { categoryName, monthlyLimit }
 *
 * Behavior:
 *  - "transaction" messages with high/medium confidence are logged immediately
 *    and the bot replies with a receipt-style confirmation bubble.
 *  - "transaction" messages with low confidence ask the user to confirm the
 *    category before saving.
 *  - "query" messages are answered directly from `monthlySummary` / `budgets`,
 *    no write to Firestore.
 *  - "unrecognized" messages get a helpful example-based nudge.
 * -------------------------------------------------------------------------
 */
export default function ChatInterface({ user, monthlySummary, budgets, customCategories = [] }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "היי! אפשר לכתוב לי למשל \"הוצאתי 60 על קפה\" או לשאול \"כמה נשאר לי על מסעדות?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(null); // low-confidence tx awaiting confirmation
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function pushBot(text, icon = null) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "bot", text, icon }]);
  }

  function pushUser(text) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "user", text }]);
  }

  function findBudget(category) {
    return budgets.find((b) => b.categoryName === category);
  }

  function answerQuery(parsed) {
    const { intent, category } = parsed;

    if (intent === "remaining_budget") {
      if (!category) {
        pushBot("על איזו קטגוריה תרצה לדעת? למשל \"כמה נשאר לי על סופרמרקט?\"");
        return;
      }
      const budget = findBudget(category);
      const spent = monthlySummary.byCategory[category] || 0;
      if (!budget) {
        pushBot(`עדיין לא הגדרת תקציב עבור "${category}". סה"כ הוצאת עליה ${formatILS(spent)} החודש.`);
        return;
      }
      const remaining = budget.monthlyLimit - spent;
      if (remaining < 0) {
        pushBot(
          `חרגת מהתקציב ל"${category}" ב-${formatILS(Math.abs(remaining))} (הוצאת ${formatILS(spent)} מתוך ${formatILS(budget.monthlyLimit)}).`,
          "down"
        );
      } else {
        pushBot(
          `נשארו לך ${formatILS(remaining)} ל"${category}" (הוצאת ${formatILS(spent)} מתוך ${formatILS(budget.monthlyLimit)}).`,
          "up"
        );
      }
      return;
    }

    if (intent === "total_spent") {
      if (category) {
        const spent = monthlySummary.byCategory[category] || 0;
        pushBot(`הוצאת ${formatILS(spent)} על "${category}" החודש.`);
      } else {
        pushBot(`סה"כ הוצאת ${formatILS(monthlySummary.totalExpense)} החודש.`);
      }
      return;
    }

    if (intent === "total_income") {
      pushBot(`סה"כ הכנסות החודש: ${formatILS(monthlySummary.totalIncome)}.`);
      return;
    }

    pushBot("לא הצלחתי להבין בדיוק את השאלה, אפשר לנסח מחדש?");
  }

  async function saveTransaction(parsed) {
    await addTransaction({
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      description: parsed.description,
      createdBy: user?.uid ?? "unknown",
    });

    const icon = parsed.type === "income" ? "up" : "receipt";
    const verb = parsed.type === "income" ? "נרשמה הכנסה" : "נרשמה הוצאה";
    pushBot(`${verb} של ${formatILS(parsed.amount)} בקטגוריית "${parsed.category}" ✓`, icon);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    pushUser(text);
    setInput("");

    // If we're waiting on a confirmation for a low-confidence parse
    if (pendingConfirm) {
      const category = text.trim();
      const confirmed = { ...pendingConfirm, category };
      setPendingConfirm(null);
      await saveTransaction(confirmed);
      return;
    }

    const parsed = parseHebrewMessage(text, customCategories);

    if (parsed.kind === "query") {
      answerQuery(parsed);
      return;
    }

    if (parsed.kind === "unrecognized") {
      pushBot('לא זיהיתי סכום בהודעה. נסה למשל: "הוצאתי 120 על סופר" או "קיבלתי 5000 משכורת".');
      return;
    }

    // kind === "transaction"
    if (parsed.confidence === "low") {
      setPendingConfirm(parsed);
      pushBot(`זיהיתי סכום של ${formatILS(parsed.amount)}, לאיזו קטגוריה לשייך אותו?`);
      return;
    }

    await saveTransaction(parsed);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl card-shadow overflow-hidden">
      <div className="px-4 py-3.5 flex items-center gap-2 hero-gradient text-white">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
          <Receipt size={15} />
        </span>
        <h2 className="font-semibold text-sm">היומן הכספי</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[var(--ink)]/8 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='למשל: "הוצאתי 300 בסופר"'
          dir="rtl"
          className="flex-1 rounded-full border border-[var(--ink)]/12 px-4 py-3 text-sm bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] placeholder:text-[var(--ink)]/40"
        />
        <button
          type="submit"
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)] active:scale-95 transition-all"
          aria-label="שלח"
        >
          <Send size={17} className="-scale-x-100" />
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }) {
  const isBot = message.from === "bot";
  const IconComp =
    message.icon === "up" ? TrendingUp : message.icon === "down" ? TrendingDown : message.icon === "receipt" ? Receipt : HelpCircle;

  if (!isBot) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--forest)] text-white px-4 py-2 text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-[var(--ink)] border border-dashed border-[var(--ink)]/25 flex items-start gap-2"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
      >
        {message.icon && (
          <IconComp
            size={16}
            className={
              "mt-0.5 shrink-0 " +
              (message.icon === "up" ? "text-[var(--forest)]" : message.icon === "down" ? "text-[var(--brick)]" : "text-[var(--gold)]")
            }
          />
        )}
        <span>{message.text}</span>
      </div>
    </div>
  );
}
