import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { UnderSheet } from "@/components/sections/Hero/UnderSheet";
import { Receipt } from "@/components/sections/Receipt";
import { Services } from "@/components/sections/Services";
import { Works } from "@/components/sections/Works";
import { Journey } from "@/components/sections/Journey";
import { News } from "@/components/sections/News";
import { Contact } from "@/components/sections/Contact";

// Il Footer vive nel layout, fuori da <main>.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Come nel layout: va chiamata in ogni file sotto [locale], o la pagina torna dinamica.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {/* Lo sticky di Hero finisce dove finisce questo contenitore: dentro <main>
          resterebbe incollato dietro tutte le sezioni. */}
      <UnderSheet>
        <Hero />
        <Receipt />
      </UnderSheet>
      <Services />
      <Works />
      {/* Process e' nascosta per scelta, non tolta: si rimette con <Process />
          da "@/components/sections/Process". */}
      <Journey />
      <News />
      <Contact />
    </>
  );
}
