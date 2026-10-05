import "./globals.css";
import { Cairo } from "next/font/google";
import { SITE } from "@/lib/site";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font", display: "swap" });

export const metadata = { title: SITE, description: "منصة تعليمية", robots: { index: false, follow: false } };
export const viewport = { width: "device-width", initialScale: 1 };

const themeScript =
  "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
