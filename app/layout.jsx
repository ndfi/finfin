import { Rubik, Frank_Ruhl_Libre } from "next/font/google";
import { AuthProvider } from "@/lib/firebase";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "פינפיננס — ניהול תקציב משפחתי",
  description: "מעקב הוצאות ותקציב משפחתי בעברית — צ׳אט חכם + דשבורד",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // required for env(safe-area-inset-bottom) in the bottom nav
  themeColor: "#2FA88C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${frankRuhl.variable}`}>
      <body className="font-sans bg-[var(--bg)] text-[var(--ink)] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
