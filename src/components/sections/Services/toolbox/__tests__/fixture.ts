import { createTranslator } from "next-intl";
import it from "../../../../../../messages/it.json";
import en from "../../../../../../messages/en.json";
import { toolboxCopy } from "../copy";

/** I testi veri, costruiti come li costruisce il server: dagli stessi file e con lo stesso codice. */
export function copyFor(lingua: "it" | "en" = "it") {
  const tc = createTranslator({ locale: lingua, messages: lingua === "it" ? it : en, namespace: "cassetta" });
  return toolboxCopy((chiave, valori) => tc(chiave as never, valori as never));
}
