import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { createFetcher } from "@/lib/news/fetcher";
import { collectNews } from "@/lib/news/collector";

// Le fonti si chiamano da qui e non dal browser: DEV rispondeva 429 e GitHub 403
// dopo poche chiamate, e la pagina non apre connessioni verso terzi. Dinamica
// perche' il build non vada in rete: la cache sta sulle chiamate (createFetcher).
export const dynamic = "force-dynamic";

const fetcher = createFetcher(
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
  return NextResponse.json(await collectNews(fetcher, new Date()));
}
