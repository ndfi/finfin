/**
 * lib/categoryMeta.js
 * ---------------------------------------------------------------------------
 * Default icon (lucide-react name) + color per category, so the budget
 * picker, the progress bars, and the pie chart all agree on how a category
 * looks without repeating the mapping in three places. A budget document
 * can still override `icon`/`color` per-household if someone wants to
 * personalize it — these are just the defaults offered when creating one.
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

export function getCategoryMeta(categoryName) {
  return (
    EXPENSE_CATEGORY_META[categoryName] ||
    INCOME_CATEGORY_META[categoryName] || { icon: "Wallet", color: "#8A8578" }
  );
}
