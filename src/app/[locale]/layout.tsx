import type { Metadata } from "next";
import { Archivo, Archivo_Black, JetBrains_Mono } from "next/font/google";
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

/**
 * Il testo che compare sotto il titolo nei risultati di ricerca, e la stessa
 * frase che finisce nei dati strutturati: e' uno dei pochi posti in cui le
 * parole con cui qualcuno cerca ci stanno tutte senza forzare niente.
 *
 * Quella di prima ("progetti, competenze e contatti") descriveva la STRUTTURA
 * del sito invece del mestiere, e nessuno cerca "progetti competenze contatti".
 */
function descrizione(locale: string): string {
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

  const langPrefix = locale === DEFAULT_LOCALE ? "/it" : `/${locale}`;
  const canonical = `${SITE_URL}${langPrefix}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, l === DEFAULT_LOCALE ? "/it" : `/${l}`]),
  );

  const title = "Andrea Ghidara";
  const description = descrizione(locale);

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

/**
 * Le due lingue sono due, e si sanno prima: senza questo Next tratta la pagina
 * come dinamica e la ricostruisce a ogni richiesta. Misurato con Lighthouse
 * mobile: 453ms di attesa per il primo byte, cioe' il 15% dell'LCP speso a
 * rifare un lavoro il cui risultato non cambia mai.
 */
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

  /* Dice a next-intl quale lingua sta costruendo. Senza, ogni `getTranslations`
     piu' in basso chiede la lingua alla richiesta in corso, e una richiesta in
     corso durante il build non c'e': la pagina ricade su dinamica. */
  setRequestLocale(locale);

  /* I dati strutturati sono il posto legittimo dei metadati: nessuno li vede,
     e non sono testo nascosto per posizionarsi. Sono anche la fonte che gli
     assistenti leggono piu' volentieri, ed e' per questo che qui ci stanno le
     tecnologie: nel testo della pagina React e Next.js compaiono una volta
     sola, dentro il racconto di un lavoro.

     `knowsAbout` dice solo cose che il sito dimostra altrove. Se un giorno ci
     si aggiunge qualcosa che in pagina non c'e', questo smette di essere un
     dato e diventa una dichiarazione. */
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: `${SITE_URL}/${locale}`,
    jobTitle: locale === "en" ? "Full Stack Web Developer" : "Sviluppatore web full stack",
    description: descrizione(locale),
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
        {/* Ultima nel DOM come si conviene a una barra fissa: chi naviga da
            tastiera la trova dopo il contenuto, non prima. */}
        <BottomNav />
        {/* Le due misure di Vercel, in fondo a tutto perche' non disegnano
            niente: sono due script differiti serviti dal nostro stesso
            dominio (/_vercel/insights/*), quindi niente terza connessione da
            aprire mentre il browser dovrebbe dipingere.

            Nessun cookie e nessun identificatore che segue la persona da un
            sito all'altro: e' la ragione per cui questo sito puo' misurarsi
            senza chiedere un consenso che nessuno legge.

            SpeedInsights e' quella che conta qui: dice se i numeri che ci
            siamo misurati con la rete finta tengono sui telefoni veri di chi
            apre la pagina. Analytics conta le visite.

            Funzionano solo in produzione e solo se le due levette sono accese
            nel pannello del progetto: in locale lo script non esiste e la
            richiesta muore, ed e' normale. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
