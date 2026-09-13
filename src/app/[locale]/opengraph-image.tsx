import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";
import itMessages from "../../../messages/it.json";
import enMessages from "../../../messages/en.json";
import { site } from "@/content/site";

/**
 * Niente "edge": il runtime edge non permette di importare qui i file JSON
 * dei messaggi. La correttezza (una card di anteprima nella lingua giusta)
 * conta più della scelta del runtime — questa rotta non è su un percorso
 * ad alto traffico.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * L'export `alt` è statico per vincolo di next/og: la sola via per farlo
 * variare per lingua è `generateImageMetadata`, che però aggiunge un
 * segmento id all'URL (es. /it/opengraph-image/0) e rompe il percorso
 * /{locale}/opengraph-image atteso dai crawler di anteprima — verificato
 * concretamente in build (route diventata
 * /[locale]/opengraph-image/[__metadata_id__], 404 sul percorso base).
 * L'immagine (il contenuto visibile nella card) resta comunque
 * pienamente localizzata: qui si perde solo il fallback di lingua del
 * solo testo alternativo per lo screen reader, non mostrato all'utente.
 * Si ripiega sull'italiano, la lingua primaria del progetto.
 */
export const alt = `Andrea Ghidara, ${itMessages.hero.eyebrow}`;

type HeroMessages = { eyebrow: string; claim: string };
type Messages = { hero: HeroMessages };

const dictionaries: Record<string, Messages> = {
  it: itMessages as Messages,
  en: enMessages as Messages,
};

function messagesFor(locale: string): Messages {
  return dictionaries[locale] ?? dictionaries[routing.defaultLocale];
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { hero } = messagesFor(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F5F1E8",
          color: "#14120F",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#6E6759" }}>
          {hero.eyebrow.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          {hero.claim}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: "#E4572E" }} />
          <div style={{ fontSize: 28, color: "#6E6759" }}>{site.url.replace("https://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
