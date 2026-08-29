import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import localFont from "next/font/local";
import "@/app/globals.css";
import { Navbar } from "@/components/shell/Navbar";
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
const mono = localFont({
  src: "../../fonts/CascadiaCode.woff2",
  variable: "--font-mono",
  display: "swap",
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
      images: [
        {
          url: "/og/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Andrea Ghidara - Portfolio",
        },
      ],
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/og-image.jpg"],
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
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
      other: [{ rel: "mask-icon", url: "/icons/safari-pinned-tab.svg" }],
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
    name: "Andrea Ghidara",
    url: SITE_URL + "/it",
    jobTitle: "Sviluppatore Web",
    sameAs: site.socials.map((social) => social.url),
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Andrea Ghidara",
    url: SITE_URL,
    inLanguage: locale,
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${archivo.variable} ${archivoBlack.variable} ${mono.variable} min-h-dvh`}>
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
          <header id="top" className="sticky top-0 z-50 bg-[var(--bg)]/85 backdrop-blur">
            <Navbar />
          </header>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
