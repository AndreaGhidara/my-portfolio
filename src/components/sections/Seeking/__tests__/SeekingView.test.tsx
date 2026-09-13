import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { SeekingView } from "../SeekingView";
import type { SeekingViewProps } from "../SeekingView";
import { seekingRoutes } from "@/content/seeking";

const mail = seekingRoutes.map((r, i) => ({
  id: r.id,
  nome: `Nome ${i}`,
  oggetto: `Oggetto ${i}`,
  anteprima: `Anteprima ${i}`,
  et: `Et ${i}`,
  titolo: `Titolo ${i}`,
  etPrima: `EtPrima ${i}`,
  prima: `Prima ${i}`,
  tipo: `Tipo ${i}`,
  cta: `Cta ${i}`,
  prova: r.prova ? { testo: `Prova ${i}`, ancora: r.prova.ancora } : null,
}));

const casella = {
  etichettaDa: "Da",
  etichettaA: "A",
  da: "una richiesta come la tua",
  a: "Andrea",
  vuoto: "Aprine una: le risposte sono quelle che scrivo davvero.",
  firma: "Andrea Ghidara",
  ruolo: "Sviluppatore web · Full stack",
};

const props: SeekingViewProps = {
  eyebrow: "Partiamo da qui",
  title: "Le cinque email che ricevo più spesso",
  intro: "Riscritte da me, non copiate.",
  attesa: "Non è un modulo: resta tutto qui.",
  etichettaTipo: "Che tipo di lavoro è",
  casella,
  mail,
};

const css = readFileSync("src/styles/tokens.css", "utf8");

/** Le regole del foglio di stile che riguardano la casella, corpo compreso. */
const regoleDellaCasella = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selettore, corpo]) => ({ selettore: selettore.trim(), corpo }))
  .filter((r) => /\[data-(casella|elenco|mail|lettura|vuoto|msg|firma)/.test(r.selettore));

/** Il corpo di una @media, preso contando le graffe: annidate, il regex mente. */
function bloccoMedia(condizione: string): string {
  const inizio = css.indexOf(`@media ${condizione}`);
  if (inizio < 0) return "";
  let i = css.indexOf("{", inizio);
  let livello = 0;
  const apre = i;
  for (; i < css.length; i++) {
    if (css[i] === "{") livello++;
    else if (css[i] === "}" && --livello === 0) return css.slice(apre + 1, i);
  }
  return "";
}

describe("la seconda sezione", () => {
  it("il titolo è un h2: sotto l'h1 dell'hero", () => {
    render(<SeekingView {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.title);
  });

  it("il testo corrente sull'arancio è inchiostro, non carta: la carta su arancio non arriva ad AA", () => {
    const { container } = render(<SeekingView {...props} />);
    expect(container.querySelector("[data-seeking-intro]")?.className).toContain("--on-accent");
    expect(container.querySelector("[data-seeking-attesa]")?.className).toContain("--on-accent");
  });

  it("dice il patto: la scelta non parte da nessuna parte", () => {
    // La riga «non è un modulo» è una promessa scritta in pagina. Se un giorno
    // la scelta comincia a viaggiare verso qualcuno, questa prova va tolta
    // INSIEME a quella riga, non prima.
    const { container } = render(<SeekingView {...props} />);
    expect(screen.getByText(props.attesa)).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });
});

describe("l'elenco della posta", () => {
  it("è un gruppo solo, con il titolo per legenda", () => {
    // Per uno screen reader sono una domanda con cinque risposte, non cinque
    // caselle sparse per la pagina.
    render(<SeekingView {...props} />);
    expect(screen.getByRole("group", { name: props.title })).toBeInTheDocument();
  });

  it("sceglie con dei radio veri: la tastiera funziona senza che la imitiamo", () => {
    // Un solo stop nel giro dei Tab, le frecce per cambiare, lo stato
    // annunciato. Con dei <button> andrebbe tutto riscritto a mano.
    render(<SeekingView {...props} />);
    const scelte = screen.getAllByRole("radio");
    expect(scelte).toHaveLength(seekingRoutes.length);
    for (const s of scelte) expect(s).toHaveAttribute("name", "posta");
  });

  it("la prima e' gia' aperta, e solo la prima", () => {
    // Prima non lo era nessuna, e la nota diceva che le cinque dovevano
    // restare pari finche' non se ne toccava una. Il costo era che il riquadro
    // di lettura si apriva su una frase di servizio, e chi non tocca niente non
    // vedeva mai una risposta: cioe' la cosa che questa sezione esiste per
    // mostrare. Le cinque anteprime restano tutte leggibili accanto, quindi
    // quello che quella nota difendeva non si e' perso.
    render(<SeekingView {...props} />);
    const scelte = screen.getAllByRole("radio");
    expect(scelte[0]).toBeChecked();
    for (const altra of scelte.slice(1)) expect(altra).not.toBeChecked();
  });

  it("ogni riga si legge intera prima di scegliere: mittente, oggetto, anteprima", () => {
    // È il motivo per cui questa forma ha vinto sulle altre: chi non apre
    // niente esce comunque avendo letto cinque volte che problemi tratti.
    const { container } = render(<SeekingView {...props} />);
    const righe = container.querySelectorAll("[data-mail]");
    expect(righe).toHaveLength(seekingRoutes.length);
    righe.forEach((riga, i) => {
      const dentro = within(riga as HTMLElement);
      expect(dentro.getByText(mail[i].nome)).toBeInTheDocument();
      expect(dentro.getByText(mail[i].oggetto)).toBeInTheDocument();
      expect(dentro.getByText(mail[i].anteprima)).toBeInTheDocument();
    });
  });
});

describe("la lettura", () => {
  it("si apre con un invito, non con una mail scelta per te", () => {
    const { container } = render(<SeekingView {...props} />);
    expect(container.querySelector("[data-vuoto]")).toHaveTextContent(casella.vuoto);
  });

  it("ogni mail ha il suo oggetto per titolo, e sono h3", () => {
    // Cinque messaggi, cinque intestazioni: chi naviga per titoli deve
    // trovarle. Da <p> la sezione avrebbe un livello solo.
    render(<SeekingView {...props} />);
    const titoli = screen.getAllByRole("heading", { level: 3 });
    expect(titoli.map((t) => t.textContent)).toEqual(mail.map((m) => m.oggetto));
  });

  it("il mittente non è mai il nome di una persona: è lo stesso per tutte e cinque", () => {
    // Inventare un mittente sarebbe una recensione falsa; lasciare il campo
    // vuoto romperebbe la forma della lettera.
    const { container } = render(<SeekingView {...props} />);
    const mittenti = [...container.querySelectorAll("[data-msg-da]")].map((d) => d.textContent);
    expect(mittenti).toHaveLength(seekingRoutes.length);
    expect(new Set(mittenti)).toEqual(new Set([casella.da]));
  });

  it("ogni risposta è firmata, e il ritratto accanto alla firma non si annuncia", () => {
    // Il nome è scritto lì di fianco: un alt su cinque ritratti uguali
    // sarebbe la stessa frase letta cinque volte per niente.
    const { container } = render(<SeekingView {...props} />);
    const firme = container.querySelectorAll("[data-firma]");
    expect(firme).toHaveLength(seekingRoutes.length);
    for (const f of firme) {
      expect(f).toHaveTextContent(casella.firma);
      expect(f).toHaveTextContent(casella.ruolo);
      expect(f.querySelector("img")).toHaveAttribute("alt", "");
    }
  });

  it("sono tutte nel DOM: senza fogli di stile si legge tutto, mai un buco", () => {
    // È il patto del fallback, ed è il motivo per cui la sezione non ha
    // bisogno di JavaScript: il CSS ne scopre una, ma non è lui a produrle.
    render(<SeekingView {...props} />);
    for (const m of mail) {
      expect(screen.getByText(m.titolo)).toBeInTheDocument();
      expect(screen.getByText(m.prima)).toBeInTheDocument();
      expect(screen.getByText(m.tipo)).toBeInTheDocument();
    }
  });

  it("ognuna porta al contatto, e quelle che ce l'hanno anche alla prova", () => {
    const { container } = render(<SeekingView {...props} />);
    const messaggi = container.querySelectorAll("[data-msg]");
    expect(messaggi).toHaveLength(seekingRoutes.length);
    messaggi.forEach((m, i) => {
      expect(within(m as HTMLElement).getByText(mail[i].cta)).toHaveAttribute("href", "#contact");
      const p = mail[i].prova;
      const rimando = m.querySelector("[data-msg-prova]");
      if (p) expect(rimando).toHaveAttribute("href", p.ancora);
      else expect(rimando, "«non ancora» non manda da nessuna parte").toBeNull();
    });
  });

  it("«non ancora» non chiede niente, ed è l'unica", () => {
    // Chiedere a chi ha appena ammesso di non sapere è il modo più rapido di
    // perderlo. Se un giorno le si aggiunge un rimando, questa prova cade.
    const senza = mail.filter((m) => m.prova === null);
    expect(senza).toHaveLength(1);
    expect(senza[0].id).toBe("nonancora");
  });
});

describe("il meccanismo senza JavaScript", () => {
  it("il foglio di stile sa aprire tutte e cinque le mail", () => {
    // L'unica cosa da tenere allineata al contenuto: una regola posizionale
    // per mail. Aggiungerne una sesta senza la sua regola vorrebbe dire una
    // risposta che non si apre mai, e nel codice non si vedrebbe.
    // Gli INDICI e non le occorrenze: gli stessi selettori compaiono in piu'
    // di un blocco (fuori aprono la mail, da 900px in su la fanno anche
    // distendere fino in fondo al riquadro), e contare le righe direbbe il
    // doppio senza che niente sia rotto. Cosi' invece si prova la cosa che
    // conta davvero: che gli indici siano esattamente 1..N, senza buchi.
    const indici = new Set(
      [...css.matchAll(/\[data-casella\]:has\(\[data-mail\]:nth-child\((\d+)\) input:checked\)/g)].map(
        (m) => Number(m[1]),
      ),
    );
    expect([...indici].sort((a, b) => a - b)).toEqual(seekingRoutes.map((_, i) => i + 1));
  });

  it("le mail partono chiuse dal CSS, non dal markup", () => {
    // Chiuse nel markup sarebbero invisibili anche senza fogli di stile.
    expect(css).toMatch(/\[data-msg\]\s*\{\s*display:\s*none/);
    const { container } = render(<SeekingView {...props} />);
    for (const m of container.querySelectorAll("[data-msg]")) {
      expect(m).not.toHaveAttribute("hidden");
      expect((m as HTMLElement).style.display).toBe("");
    }
  });
});

describe("i colori della casella", () => {
  it("non chiede niente ai token che cambiano col tema", () => {
    // La casella è carta e inchiostro SEMPRE: sta dentro una sezione arancio
    // che di notte resta arancio. Con --fg, --line o --fg-muted il tema scuro
    // le ribaltava addosso, e diventava testo carta su fondo carta: spariva.
    // Le due sfumature che le servono nascono dentro di lei, da --ink e
    // --paper. Questa prova è l'unica guardia che ha: nel DOM non si vede.
    expect(regoleDellaCasella.length).toBeGreaterThan(10);
    const colpevoli = regoleDellaCasella.filter((r) =>
      /var\(\s*--(fg|line|bg)\b/.test(r.corpo),
    );
    expect(colpevoli.map((r) => r.selettore)).toEqual([]);
  });

  it("sotto i 900px le anteprime spariscono: impilate sarebbero un muro", () => {
    // I due riquadri diventano uno sopra l'altro, e cinque anteprime da due
    // righe starebbero fra il visitatore e la prima risposta.
    expect(bloccoMedia("(max-width: 899.98px)")).toMatch(
      /\[data-mail-ant\]\s*\{[^}]*display:\s*none/,
    );
  });
});
