import { createTranslator } from "next-intl";
import it from "../../../../../../messages/it.json";
import en from "../../../../../../messages/en.json";
import { toolboxCopy } from "../copy";

// Costruiti come li costruisce il server, cosi' una chiave mancante si vede nei test.
export function copyFor(locale: "it" | "en" = "it") {
  const tc = createTranslator({ locale, messages: locale === "it" ? it : en, namespace: "cassetta" });
  return toolboxCopy((key, values) => tc(key as never, values as never));
}
