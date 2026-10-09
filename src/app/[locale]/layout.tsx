import type { Metadata } from "next";
import {
  Archivo,
  Archivo_Black,
  Fraunces,
  JetBrains_Mono,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";
import "@/app/globals.css";
import { Navbar } from "@/components/shell/Navbar";
import { BottomNav } from "@/components/shell/BottomNav";
import { TopStateScript } from "@/components/shell/TopStateScript";
import { HeaderScrollState } from "@/components/shell/HeaderScrollState";
import { WebCorner } from "@/components/brand/WebCorner";
import { Footer } from "@/components/sections/Footer";
import { ThemeScript } from "@/components/shell/ThemeScript";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { site } from "@/content/site";

const SITE_URL = site.url;

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const monoFull = localFont({
  src: "../../fonts/CascadiaCode.woff2",
  variable: "--font-mono-full",
  display: "swap",
  preload: false,
});
const monoLight = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono-light",
  display: "swap",
  preload: false,
});

/* I caratteri del sito finto del gioco (Services/game), che compaiono solo a chi
   gioca: senza preload si scaricano quando servono. Solo i pesi che il sito
   finto chiede, perche' un peso mancante il browser lo finge. */
const fakeFraunces = Fraunces({
  subsets: ["latin"],
  weight: "600",
  style: ["normal", "italic"],
  variable: "--font-fake-fraunces",
  display: "swap",
  preload: false,
});
const fakeGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-fake-grotesk",
  display: "swap",
  preload: false,
});
const fakePlayfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-fake-playfair",
  display: "swap",
  preload: false,
});

// La frase dei risultati di ricerca e dei dati strutturati: dice il mestiere,
// non la struttura del sito, perche' e' il mestiere che si cerca.
function siteDescription(locale: string): string {
  return locale === "en"
    ? "Andrea Ghidara, full stack web developer in Italy. Custom websites, online stores and platforms, built with React, Next.js and TypeScript."
    : "Andrea Ghidara, sviluppatore e programmatore web full stack in Italia. Siti, e-commerce e piattaforme su misura, in React, Next.js e TypeScript.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const canonical = `${SITE_URL}/${locale}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}`]),
  );

  const title = "Andrea Ghidara";
  const description = siteDescription(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: "%s | Andrea Ghidara" },
    description,
    verification: {
      google: "aLDY6MBOIPRgcr_V5661w19BPjzQ1r4TNxsARSMlpbc",
    },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Andrea Ghidara",
      title,
      description,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [{ url: "/favicon.ico" }],
    },
    manifest: "/site.webmanifest",
  };
}

// Senza, Next ricostruisce la pagina a ogni richiesta: 453ms di primo byte su
// Lighthouse mobile, il 15% dell'LCP.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

  // Senza, `getTranslations` chiede la lingua alla richiesta, che nel build non
  // c'e', e la pagina ricade su dinamica.
  setRequestLocale(locale);

  // `knowsAbout` dice solo cose che il sito dimostra altrove: aggiungerci qualcosa
  // che in pagina non c'e' lo trasforma da dato in dichiarazione.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: `${SITE_URL}/${locale}`,
    jobTitle: locale === "en" ? "Full Stack Web Developer" : "Sviluppatore web full stack",
    description: siteDescription(locale),
    image: `${SITE_URL}/brand/avatar.webp`,
    email: site.email,
    knowsAbout: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Sviluppo web full stack",
      "E-commerce",
      "UI/UX",
    ],
    address: { "@type": "PostalAddress", addressCountry: "IT" },
    sameAs: site.socials.map((social) => social.url),
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: SITE_URL,
    inLanguage: locale,
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <TopStateScript />
      </head>
      <body className={`${archivo.variable} ${archivoBlack.variable} ${monoFull.variable} ${monoLight.variable} ${fakeFraunces.variable} ${fakeGrotesk.variable} ${fakePlayfair.variable} relative min-h-dvh`}>
        <Script
          id="ld-person"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <NextIntlClientProvider>
          <SmoothScroll />

          <HeaderScrollState />

          {/* Qui e non nell'hero, che e' overflow-hidden e la tagliava. A -z-10
              le lettere di ANDREA le passano davanti, e il fondo di <body> resta
              dietro perche' si propaga al canvas. */}
          <WebCorner className="pointer-events-none absolute left-0 top-0 -z-10 block w-36 lg:w-72" />

          <header id="top" data-site-header className="sticky top-0 z-50">
            <Navbar />
          </header>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
        {/* Fuori da <main>: dentro, un <footer> perde il ruolo contentinfo (HTML-AAM). */}
        <Footer />
        {/* Ultima nel DOM: da tastiera si trova dopo il contenuto, non prima. */}
        <BottomNav />
        {/* Script differiti dallo stesso dominio, senza cookie: niente consenso da
            chiedere. Funzionano solo in produzione con le levette accese nel
            pannello di Vercel: in locale la richiesta fallisce, ed e' normale. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
