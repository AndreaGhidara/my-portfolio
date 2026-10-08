import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { creaChiedi } from "@/lib/news/fetcher";
import { raccogli } from "@/lib/news/collector";

/**
 * Le notizie della sezione «Le notizie della settimana». Si chiamano da qui e
 * non dal browser: nei prototipi DEV rispondeva 429 e GitHub 403 dopo poche
 * chiamate, e la pagina non apre connessioni verso terzi.
 *
 * La route e' dinamica, cosi' il build non va in rete. La cache sta sulle
 * singole chiamate (vedi creaChiedi): ogni fonte ha la sua ora, e una fonte
 * che fallisce non entra in cache e si ritenta alla richiesta dopo.
 */
export const dynamic = "force-dynamic";

const chiedi = creaChiedi(
  (url, init) => fetch(url, init),
  (url) => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": `${site.url} (notizie)`,
    };
    // Facoltativo: senza, GitHub concede 60 chiamate l'ora per indirizzo.
    if (new URL(url).hostname === "api.github.com" && process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
  },
);

export async function GET() {
  return NextResponse.json(await raccogli(chiedi, new Date()));
}
