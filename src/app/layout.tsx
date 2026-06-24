import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, DM_Sans } from "next/font/google";
import { googleFontsHref } from "@/lib/engine/fonts";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-cinzel-decorative",
  display: "swap",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Йоба генератор фавиконок от Akuma no SEO",
  description: "Production favicon & logo factory for SEO / iGaming networks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cinzelDecorative.variable} ${cinzel.variable} ${dmSans.variable}`}>
      <head>
        {/* Favicon font library — loaded once so canvas exports use correct glyphs. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontsHref()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
