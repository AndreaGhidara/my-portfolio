import type { Metadata } from "next";
import { Archivo, Archivo_Black, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "@/app/globals.css";
import { Navbar } from "@/components/shell/Navbar";
import { TopStateScript } from "@/components/shell/TopStateScript";
import { HeaderScrollState } from "@/components/shell/HeaderScrollState";
import { WebCorner } from "@/components/brand/WebCorner";
import { Footer } from "@/components/sections/Footer";
import { ThemeScript } from "@/components/shell/ThemeScript";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { site } from "@/content/site";

const SITE_URL = "https://a-ghidara-dev.vercel.app";
const DEFAULT_LOCALE = "it";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const langPrefix = locale === DEFAULT_LOCALE ? "/it" : `/${locale}`;
  const canonical = `${SITE_URL}${langPrefix}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, l === DEFAULT_LOCALE ? "/it" : `/${l}`]),
  );

  const title = "Andrea Ghidara";
  const description =
    "Andrea Ghidara: progetti, competenze e contatti. Sviluppo web e UI/UX.";

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

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: `${SITE_URL}/${locale}`,
    jobTitle: "Sviluppatore Web",
    email: site.email,
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
      <body className={`${archivo.variable} ${archivoBlack.variable} ${monoFull.variable} ${monoLight.variable} relative min-h-dvh`}>
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

          {/* Ancorata all'angolo vero della pagina, non a quello dell'hero:
              dentro <section id="hero"> (overflow-hidden) veniva tagliata e si
              riduceva a un arco casuale sul bordo sinistro.
              A -z-10 le lettere di ANDREA le passano davanti, mentre il fondo
              di <body> resta comunque dietro perche' si propaga al canvas.
              Sopra c'e' solo l'header, che in cima alla pagina e' trasparente
              apposta per non tagliarla. Decorativa: pointer-events-none. */}
          <WebCorner className="pointer-events-none absolute left-0 top-0 -z-10 block w-36 lg:w-72" />

          <header id="top" data-site-header className="sticky top-0 z-50">
            <Navbar />
          </header>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
        {/* Fuori da <main>: e' chrome di sito come la Navbar, e un <footer>
            dentro <main> perde il ruolo implicito contentinfo (HTML-AAM). */}
        <Footer />
      </body>
    </html>
  );
}
