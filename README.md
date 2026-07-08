# פינפיננס — Household Finance App

אפליקציית ניהול תקציב משפחתי היברידית: צ'אט בעברית + דשבורד ויזואלי.
Built with Next.js (App Router) + Tailwind CSS + Firebase (Firestore + Auth) + Recharts + lucide-react.

---

## 1. Project Setup

### 1.1 Create the Next.js app

```bash
npx create-next-app@latest finance-app --js --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd finance-app
```

When prompted, you can decline TypeScript (this codebase is plain JS/JSX, but it will work fine in a TS project too if you rename files to `.tsx`/`.ts` and add light typing).

### 1.2 Install dependencies

```bash
npm install firebase recharts lucide-react clsx date-fns
npm install -D tailwindcss @tailwindcss/postcss
```

- `firebase` — Firestore + Auth SDK
- `recharts` — pie/bar charts
- `lucide-react` — icon set used across budgets/categories
- `clsx` — conditional className helper
- `date-fns` — month boundaries / day-of-month math for recurring transactions, plus Hebrew date formatting for the transaction list
- `tailwindcss` / `@tailwindcss/postcss` — as of **Tailwind CSS v4**, the PostCSS plugin lives in its own package (`@tailwindcss/postcss`) instead of being `tailwindcss` itself, and `autoprefixer` is now bundled in automatically. `npm install tailwindcss` today installs v4 by default, so this project is written for v4: `app/globals.css` uses `@import "tailwindcss";` (not the old `@tailwind base/components/utilities;` directives) plus `@config "../tailwind.config.js";` to keep loading the custom color/font tokens from `tailwind.config.js`. If you're intentionally on Tailwind v3 for some reason, swap that back to the three `@tailwind` directives and use `tailwindcss`+`autoprefixer` directly in `postcss.config.js` instead.

> **"Failed to fetch... The PostCSS plugin has moved to a separate package"** — this means `postcss.config.js` is still pointing at `tailwindcss` directly (the v3 way) while `tailwindcss` itself resolved to v4 in `node_modules`. Fix: `postcss.config.js` should list `"@tailwindcss/postcss": {}` as the plugin, and `globals.css` should start with `@import "tailwindcss";`, not `@tailwind base;` etc. Both are already correct in this project as delivered — if you still see this error, check that you don't have a second, older Tailwind version pinned somewhere (lockfile, monorepo root, etc.) and restart the dev server after any change to `postcss.config.js`, since it isn't hot-reloaded.

> **If the app renders with no styling at all** (default browser button borders, no rounded corners, elements stacked with no layout) — that's almost always a missing `postcss.config.js` entirely. This project ships one at the root; make sure it landed there (not inside `app/` or `lib/`).

### 1.3 Hebrew fonts

This project uses **Rubik** (clean UI sans, great Hebrew support) for body/UI text and **Frank Ruhl Libre** for headings/numbers — a serif with real Hebrew presence, good for a "receipt/ledger" feel. Both are loaded via `next/font/google` in `app/layout.jsx`, no manual `<link>` tags needed.

### 1.4 Firebase project setup

1. Go to https://console.firebase.google.com → Create project.
2. Enable **Firestore Database** (start in production mode).
3. Enable **Authentication** → Sign-in method → turn on **Email/Password** (or Google, if you prefer — the `AuthProvider` in `lib/firebase.js` is written for email/password but swapping providers is a small change).
4. Project settings → General → "Your apps" → Web app → copy the config object.
5. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 1.5 Firestore Security Rules

Since this is a household app (a handful of trusted users sharing one budget), the simplest robust model is: **any authenticated user in your household can read/write all household data**. Paste this into Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    match /transactions/{docId} {
      allow read, create: if isSignedIn();
      // Any signed-in household member can edit or delete any transaction.
      // This is required for the "reset month" feature, which bulk-deletes
      // every transaction in a month regardless of who logged it. If you'd
      // rather restrict edits/deletes to the original author, swap the line
      // below for: allow update, delete: if isSignedIn() && resource.data.createdBy == request.auth.uid;
      // — but then "reset month" must run as a Cloud Function with admin
      // privileges instead of a client-side batch delete.
      allow update, delete: if isSignedIn();
    }

    match /budgets/{docId} {
      allow read, write: if isSignedIn();
    }

    match /recurring/{docId} {
      allow read, write: if isSignedIn();
    }
  }
}
```

(`transactions` lets any household member create an entry, but only the person who logged it can edit/delete it — tweak the `update, delete` rule to `isSignedIn()` alone if you want anyone to be able to correct anyone else's entries.)

### 1.6 Firestore composite index

The "current month" query filters by `timestamp` range and orders by `timestamp`, which Firestore handles with the automatic single-field index — no composite index needed for the queries in this codebase. If you later add a query that combines `category ==` with a `timestamp` range, Firestore will prompt you in the console with a direct link to create the needed composite index.

### 1.6.1 What's new since the first version

- **Budget goals UI**: `components/BudgetForm.jsx` — tap "הוספת תקציב לקטגוריה" under Budgets to set a monthly limit per category via a colorful category-icon picker (mirrors the reference app's category grid). Tap an existing budget card to edit or delete it.
- **Month navigation + reset**: the header now has ‹ › arrows to browse past months (read-only view of history), and a reset icon that bulk-deletes all manually-logged transactions for the month currently shown, via `resetMonthTransactions()` in `lib/hooks.js`. Recurring items (rent, salary, etc.) are untouched by design — they're re-computed projections, not stored per month.
- **Palette refresh**: `app/globals.css` now uses a warm gold → teal duo (`--gold`, `--teal`) instead of the earlier forest-green ledger look, plus a `BalanceHeroCard` component with a centered donut chart and category legend, closer to the reference screenshots.

### 1.6.2 Round 3: bold redesign + the actual root cause of the broken layout

The earlier "still looks bad" screenshots weren't a styling-taste problem — they were **Tailwind never being processed at all** (default browser button borders, no flex/grid layout). That happens when `postcss.config.js` is missing, since Next.js relies on PostCSS to turn the `@tailwind` directives in `globals.css` into real CSS. This project now ships `postcss.config.js` and `next.config.js` directly at the root so that risk is gone regardless of how the project was scaffolded.

On top of that, the visual language moved from the earlier pale gold→teal diagonal gradient to a bolder, flatter system (solid `--teal` brand color, `--coral` for expenses, `--gold` for accents/CTAs) closer to the reference screenshots — plus two new pieces:

- **`components/CategoryDonutCard.jsx`** — the donut chart split out into its own card (previously combined with the balance card, which is what caused the earlier overlap bug).
- **`components/TransactionList.jsx`** — a real, persistent ledger view (date-grouped, category badge chips, recurring items marked "צפוי") — previously transactions were only visible transiently inside the chat log.
- **`components/BalanceHeroCard.jsx`** — redesigned as a solid-color card with light/dark income/expense stat pills and quick-add buttons that jump to the chat tab.

A dependency-free `preview.html` (static HTML/CSS mockup, no npm required) is included alongside this README so the design can be sanity-checked in any browser before wiring it into the real Next.js project.

### 1.6.3 Round 4: Tailwind v4 compatibility

If you installed dependencies fresh, `npm install tailwindcss` now resolves to **Tailwind CSS v4**, which changed two things this project depended on: the PostCSS plugin moved from `tailwindcss` itself to `@tailwindcss/postcss`, and the old `@tailwind base/components/utilities;` directives in CSS were replaced by a single `@import "tailwindcss";`. Both `postcss.config.js` and `app/globals.css` are now written for v4, with `@config "../tailwind.config.js";` added so the custom color/font-family tokens in `tailwind.config.js` still apply under v4's config model. This was verified with a real `next build` against Tailwind v4.3.2 before delivery, not just a syntax check.

### 1.6.4 Round 5: app rename + chart axis fix

- **Renamed** the app from "גבל'לי כספים" to **פינפיננס** everywhere (header, login screen, browser tab title, this README, `preview.html`).
- **Fixed the 6-month bar chart running backwards**: `components/Charts.jsx` had an `XAxis reversed` prop left over from an earlier RTL experiment, which made the months render newest-to-oldest left-to-right (e.g. July, June, May... instead of February, March, April...). Time/numeric chart axes conventionally stay chronological left-to-right even inside an RTL page — only text direction flips, not plotted data (this matches how Hebrew banking apps render their charts). That prop is removed; the value (₪) axis was also moved to the right side, which reads more naturally as the first thing encountered in RTL, and bar sizing/spacing was tightened up.

### 1.7 File layout

```
finance-app/
├── app/
│   ├── layout.jsx        # fonts, RTL <html dir="rtl">, viewport, global providers
│   ├── page.jsx          # main dashboard + chat layout
│   └── globals.css
├── components/
│   ├── ChatInterface.jsx
│   ├── BalanceHeroCard.jsx
│   ├── CategoryDonutCard.jsx
│   ├── TransactionList.jsx
│   ├── BudgetProgress.jsx
│   ├── BudgetForm.jsx
│   └── Charts.jsx
├── lib/
│   ├── firebase.js       # Firebase init + Auth context/hook
│   ├── parser.js         # Hebrew NLP/regex parser
│   ├── categoryMeta.js   # shared icon/color per category
│   ├── hooks.js          # Firestore CRUD hooks (transactions/budgets/recurring)
│   └── utils.js          # month helpers, recurring-transaction materialization
├── postcss.config.js     # required for Tailwind's @tailwind directives to compile
├── next.config.js
├── tailwind.config.js
├── jsconfig.json         # the @/* import alias
├── preview.html          # standalone, dependency-free design preview
└── .env.local
```

Copy each file from this delivery into the matching path, run:

```bash
npm run dev
```

and open http://localhost:3000.

---

## 2–4. See the accompanying source files

The dashboard/chat layout, the Hebrew parser, and the Firestore hooks are provided as separate files alongside this README (same folder structure as above). Each file is heavily commented in Hebrew-aware sections explaining the logic.
