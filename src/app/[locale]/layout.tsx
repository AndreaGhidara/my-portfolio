import type { Metadata } from "next";
import { Geist_Mono, Kanit } from "next/font/google";
import "@/app/globals.css";
import Navbar from "@/components/organisms/Navbar";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";

const SITE_URL = "https://a-ghidara-dev.vercel.app";
const DEFAULT_LOCALE = "it";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600"],
  variable: "--font-kanit",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    sameAs: [
      "https://www.linkedin.com/in/andrea-ghidara",
      "https://github.com/AndreaGhidara",
    ],
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Andrea Ghidara",
    url: SITE_URL,
    inLanguage: locale,
  };

  return (
    <html
      lang={locale}
      className="motion-safe:scroll-smooth motion-reduce:scroll-auto"
    >
      <body
        className={`${kanit.variable} ${geistMono.variable} antialiased h-full`}
      >
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
          <header className="sticky top-0 z-50">
            <Navbar />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
