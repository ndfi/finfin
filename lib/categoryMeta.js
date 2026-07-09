/**
 * lib/categoryMeta.js
 * ---------------------------------------------------------------------------
 * Default icon (lucide-react name) + color per built-in category, plus the
 * merge logic that layers a household's custom categories (stored in
 * Firestore via lib/hooks.js's useCategories()) on top of these defaults.
 *
 * Two lookup modes:
 *  - getCategoryMeta(name) — built-ins only, no Firestore data needed. Used
 *    wherever a component only has a category *name* string and no live
 *    custom-categories list (safe default, never throws).
 *  - getCategoryMeta(name, mergedMeta) — pass the object returned by
 *    mergeCategoryMeta() to also resolve custom categories correctly.
 * ---------------------------------------------------------------------------
 */

export const EXPENSE_CATEGORY_META = {
  "סופרמרקט": { icon: "ShoppingCart", color: "#2FA88C" },
  "מסעדות": { icon: "UtensilsCrossed", color: "#F0932B" },
  "תחבורה": { icon: "Car", color: "#4A7FBF" },
  "בילויים": { icon: "Ticket", color: "#9B6BD1" },
  "ביגוד": { icon: "Shirt", color: "#E0648C" },
  "בריאות": { icon: "HeartPulse", color: "#E05C5C" },
  "חשבונות": { icon: "Zap", color: "#E0B93D" },
  "דיור": { icon: "Home", color: "#6E8B5A" },
  "חינוך": { icon: "GraduationCap", color: "#5C6BC0" },
  "פנאי ותחביבים": { icon: "Dumbbell", color: "#3DBFB8" },
  "מתנות ואירועים": { icon: "Gift", color: "#D179C7" },
  "אחר": { icon: "MoreHorizontal", color: "#8A8578" },
};

export const INCOME_CATEGORY_META = {
  "משכורת": { icon: "Wallet", color: "#2FA88C" },
  "בונוס": { icon: "Award", color: "#E0B93D" },
  "החזר": { icon: "RotateCcw", color: "#4A7FBF" },
  "אחר (הכנסה)": { icon: "MoreHorizontal", color: "#8A8578" },
};

const DEFAULT_META = { icon: "Wallet", color: "#8A8578" };

/**
 * Curated icon + color options offered when a user creates a new category
 * from within the app — kept intentionally small (not "every lucide icon")
 * so the picker stays a quick tap-through, not an overwhelming search.
 */
export const CATEGORY_ICON_CHOICES = [
  "ShoppingCart", "UtensilsCrossed", "Car", "Ticket", "Shirt", "HeartPulse",
  "Zap", "Home", "GraduationCap", "Dumbbell", "Gift", "Wallet", "Award",
  "RotateCcw", "Coffee", "Plane", "Baby", "PawPrint", "Wrench", "Smartphone",
  "Music", "Book", "Fuel", "Palette",
];

export const CATEGORY_COLOR_CHOICES = [
  "#2FA88C", "#F0932B", "#4A7FBF", "#9B6BD1", "#E0648C", "#E05C5C",
  "#E0B93D", "#6E8B5A", "#5C6BC0", "#3DBFB8", "#D179C7", "#8A8578",
];

/**
 * Merge built-in categories with a household's custom ones (from Firestore).
 * A custom category with the same name as a built-in overrides it — lets
 * someone re-color or re-icon a default without needing to delete it.
 */
export function mergeCategoryMeta(customCategories = []) {
  const expense = { ...EXPENSE_CATEGORY_META };
  const income = { ...INCOME_CATEGORY_META };

  for (const c of customCategories) {
    const target = c.type === "income" ? income : expense;
    target[c.name] = { icon: c.icon, color: c.color, custom: true, id: c.id };
  }

  return { expense, income };
}

export function getCategoryMeta(categoryName, mergedMeta = null) {
  if (mergedMeta) {
    return mergedMeta.expense[categoryName] || mergedMeta.income[categoryName] || DEFAULT_META;
  }
  return EXPENSE_CATEGORY_META[categoryName] || INCOME_CATEGORY_META[categoryName] || DEFAULT_META;
}
