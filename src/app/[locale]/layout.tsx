import type { Metadata } from "next";
import { Geist_Mono, Kanit } from "next/font/google";
import "@/app/globals.css";
import Navbar from "@/components/organisms/Navbar";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600"],
  variable: "--font-kanit",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andrea Ghidara Portfolio",
  description: "Andrea Ghidara - Portfolio",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className="motion-safe:scroll-smooth motion-reduce:scroll-auto"
    >
      <body
        className={`${kanit.variable} ${geistMono.variable} antialiased h-full`}
      >
        <NextIntlClientProvider>
          <header className="sticky top-0 z-50">
            <Navbar />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
