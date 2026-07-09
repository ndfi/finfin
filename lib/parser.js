/**
 * lib/parser.js
 * ---------------------------------------------------------------------------
 * Turns a Hebrew free-text chat message into either:
 *   (a) a structured transaction { type, amount, category, description }, or
 *   (b) a structured query intent  { intent, category }
 *
 * This is intentionally a hand-built rule engine (regex + keyword dictionaries)
 * rather than calling an LLM: it's instant, free, works offline, and is
 * completely predictable — important for a "did my money get logged
 * correctly" use case. Swap in a Claude API call later for messages this
 * parser can't confidently resolve (see `parseWithFallback` at the bottom).
 * ---------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------
// 1. Category dictionaries
//    Each category maps to a list of trigger keywords (in their base form).
//    Hebrew attaches prepositions directly to nouns (ב/ל/מ/ו/ש/כ + word),
//    so matching happens after `stripPrefixes()` below, not on raw tokens.
// -----------------------------------------------------------------------
export const EXPENSE_CATEGORIES = {
  "סופרמרקט": ["סופר", "סופרמרקט", "מכולת", "שופרסל", "רמי לוי", "ויקטורי", "יינות ביתן"],
  "מסעדות": ["מסעדה", "מסעדות", "פיצה", "המבורגר", "סושי", "קפה", "בית קפה", "קפיטריה", "ארוחה", "טייקאווי", "משלוח"],
  "תחבורה": ["דלק", "תדלוק", "אוטובוס", "רכבת", "מונית", "חניה", "כביש אגרה", "רב קו", "אוטו", "מוסך"],
  "בילויים": ["קולנוע", "סרט", "בילוי", "בילויים", "בר ", "פאב", "הופעה", "כרטיסים", "פארק שעשועים"],
  "ביגוד": ["בגדים", "נעליים", "ביגוד", "חולצה", "מכנסיים", "זארה", "קסטרו"],
  "בריאות": ["רופא", "תרופות", "בריאות", "קופת חולים", "שיניים", "רופא שיניים", "משקפיים", "טיפול"],
  "חשבונות": ["חשמל", "מים", "ארנונה", "גז", "אינטרנט", "סלולר", "טלפון", "פלאפון", "חשבון"],
  "דיור": ["שכירות", "שכר דירה", "משכנתא", "ועד בית", "דירה"],
  "חינוך": ["גן", "בית ספר", "לימודים", "חוג", "חוגים", "צהרון", "ספרים"],
  "פנאי ותחביבים": ["ספורט", "חדר כושר", "מנוי", "תחביב"],
  "מתנות ואירועים": ["מתנה", "מתנות", "יום הולדת", "חתונה", "אירוע"],
};

export const INCOME_CATEGORIES = {
  "משכורת": ["משכורת", "שכר", "משכורות"],
  "בונוס": ["בונוס", "מענק"],
  "החזר": ["החזר", "זיכוי", "קצבה"],
  "אחר (הכנסה)": [],
};

const ALL_CATEGORY_MAPS = [
  { type: "expense", map: EXPENSE_CATEGORIES },
  { type: "income", map: INCOME_CATEGORIES },
];

// -----------------------------------------------------------------------
// 2. Verb dictionaries for determining transaction type
// -----------------------------------------------------------------------
const EXPENSE_VERBS = [
  "הוצאתי", "שילמתי", "קניתי", "בזבזתי", "עלה לי", "עלה עליי", "שרפתי",
  "הוצאנו", "שילמנו", "קנינו",
];

const INCOME_VERBS = [
  "קיבלתי", "קיבלנו", "נכנס לי", "נכנסו לי", "הרווחתי", "הפקדתי",
];

// -----------------------------------------------------------------------
// 3. Query dictionaries
// -----------------------------------------------------------------------
const QUERY_TRIGGERS = ["כמה", "מה נשאר", "נשאר לי", "יתרה", "כמה נשאר", "מה המצב", "?"];
const REMAINING_BUDGET_HINTS = ["נשאר", "יתרה", "עוד יש לי"];
const TOTAL_SPENT_HINTS = ["הוצאתי", "בזבזתי", "הוצאות"];
const TOTAL_INCOME_HINTS = ["הכנסות", "קיבלתי", "נכנס"];

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

// Hebrew prefix letters that attach directly to a following noun.
// Order matters: try stripping combinations like "וב" (and-in) before single letters.
const PREFIX_COMBOS = ["וב", "ול", "ומ", "וש", "וכ", "ב", "ל", "מ", "ו", "ש", "כ", "ה"];

/** Strip one leading Hebrew preposition/conjunction from a word, if present. */
function stripPrefix(word) {
  for (const p of PREFIX_COMBOS) {
    if (word.length > p.length + 1 && word.startsWith(p)) {
      return word.slice(p.length);
    }
  }
  return word;
}

/** Normalize text: trim, collapse whitespace, remove punctuation except ? and digits/commas. */
function normalize(text) {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Extract a monetary amount from text.
 * Handles: "300", "300.50", "1,200", "300 ש\"ח", "300 שקל", "2 אלף", "2.5 אלף"
 */
function extractAmount(text) {
  // "X אלף" -> X * 1000 (e.g. "2 אלף" / "2.5 אלף")
  const thousandMatch = text.match(/(\d+(?:[.,]\d+)?)\s*אלף/);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1].replace(",", ".")) * 1000;
  }

  // Plain number, optionally with thousands separators/decimals.
  // `\d+` is greedy so it grabs the full digit run (e.g. "8000") before the
  // optional ",ddd" groups are considered — this must NOT be capped at
  // \d{1,3} or multi-digit amounts like 8000 get truncated to 800.
  const numMatch = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
  if (numMatch) {
    return parseFloat(numMatch[0].replace(/,/g, ""));
  }
  return null;
}

/**
 * Find the first category (and its parent type) whose keyword appears in the
 * text. Built-in keyword dictionaries are checked first (they're hand-tuned
 * with multiple trigger phrases per category); a household's custom
 * categories are checked second, matched against their own name as the
 * single keyword — e.g. a custom "חיות מחמד" category matches on that exact
 * phrase (prefix-stripped, same as built-ins) appearing in the message.
 */
function extractCategory(text, customCategories = []) {
  const words = text.split(" ").map(stripPrefix);
  const strippedText = words.join(" ");

  for (const { type, map } of ALL_CATEGORY_MAPS) {
    for (const [category, keywords] of Object.entries(map)) {
      for (const kw of keywords) {
        if (strippedText.includes(kw) || text.includes(kw)) {
          return { category, categoryType: type };
        }
      }
    }
  }

  for (const c of customCategories) {
    if (strippedText.includes(c.name) || text.includes(c.name)) {
      return { category: c.name, categoryType: c.type };
    }
  }

  return { category: null, categoryType: null };
}

function detectTransactionType(text) {
  if (EXPENSE_VERBS.some((v) => text.includes(v))) return "expense";
  if (INCOME_VERBS.some((v) => text.includes(v))) return "income";
  return null;
}

function isQuery(text) {
  return QUERY_TRIGGERS.some((q) => text.includes(q));
}

function detectQueryIntent(text) {
  if (REMAINING_BUDGET_HINTS.some((h) => text.includes(h))) return "remaining_budget";
  if (TOTAL_INCOME_HINTS.some((h) => text.includes(h))) return "total_income";
  if (TOTAL_SPENT_HINTS.some((h) => text.includes(h))) return "total_spent";
  return "remaining_budget"; // sensible default for "כמה יש לי על X" style phrasing
}

// -----------------------------------------------------------------------
// 4. Public API
// -----------------------------------------------------------------------

/**
 * Parse a chat message.
 *
 * @param {string} rawText
 * @param {Array<{name: string, type: "expense"|"income"}>} customCategories
 *   The household's user-created categories (from useCategories()), so the
 *   parser can recognize them by name alongside the built-in keyword lists.
 *
 * Returns one of:
 *   { kind: "query", intent, category }
 *   { kind: "transaction", type, amount, category, description, confidence }
 *   { kind: "unrecognized", raw }
 */
export function parseHebrewMessage(rawText, customCategories = []) {
  const text = normalize(rawText);

  // --- Query path -------------------------------------------------------
  if (isQuery(text)) {
    const { category } = extractCategory(text, customCategories);
    return {
      kind: "query",
      intent: detectQueryIntent(text),
      category, // may be null -> caller should ask "על איזו קטגוריה?" or show all
      raw: text,
    };
  }

  // --- Transaction path ---------------------------------------------------
  const amount = extractAmount(text);
  const verbType = detectTransactionType(text);
  const { category, categoryType } = extractCategory(text, customCategories);

  // Type resolution priority: explicit verb > category's natural type > fallback "expense"
  const type = verbType || categoryType || (amount ? "expense" : null);

  if (!amount) {
    return { kind: "unrecognized", raw: text };
  }

  // Confidence flag: did we find an explicit verb AND a category? Full confidence.
  // Missing one of them means the UI should let the user confirm/edit before saving.
  const confidence = verbType && category ? "high" : category || verbType ? "medium" : "low";

  return {
    kind: "transaction",
    type: type || "expense",
    amount,
    category: category || (type === "income" ? "אחר (הכנסה)" : "אחר"),
    description: text,
    confidence,
  };
}

/**
 * Optional fallback: if the local parser returns "unrecognized" or "low"
 * confidence, you can route the raw text to the Claude API for a best-effort
 * structured read, then merge it back into the same shape. Left as a stub —
 * wire this to your own /api/parse route if you want it.
 *
 * export async function parseWithFallback(rawText) {
 *   const local = parseHebrewMessage(rawText);
 *   if (local.kind !== "unrecognized" && local.confidence !== "low") return local;
 *   const res = await fetch("/api/parse", { method: "POST", body: JSON.stringify({ text: rawText }) });
 *   return res.json();
 * }
 */

// -----------------------------------------------------------------------
// Examples (for quick manual testing — remove or keep behind NODE_ENV check):
//
// parseHebrewMessage("הוצאתי 300 בסופר")
//   -> { kind:"transaction", type:"expense", amount:300, category:"סופרמרקט", ... }
//
// parseHebrewMessage("קיבלתי 8000 משכורת")
//   -> { kind:"transaction", type:"income", amount:8000, category:"משכורת", ... }
//
// parseHebrewMessage("כמה נשאר לי על מסעדות?")
//   -> { kind:"query", intent:"remaining_budget", category:"מסעדות" }
//
// parseHebrewMessage("שילמתי 45 ש\"ח על דלק")
//   -> { kind:"transaction", type:"expense", amount:45, category:"תחבורה", ... }
// -----------------------------------------------------------------------
