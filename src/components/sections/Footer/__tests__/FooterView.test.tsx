import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FooterView } from "../FooterView";

const props = {
  tagline: "Costruisco software per il web. Da Torino, per chi ha un'attività da far crescere.",
  rispondiA: "Rispondi a",
  ancheQui: "Anche qui",
  citta: "10100 Torino (TO), Italia",
  ufficio: "TORINO",
  paese: "ITALIA",
  rights: "Tutti i diritti riservati.",
  name: "Andrea Ghidara",
  email: "andrea.ghidara.dev@gmail.com",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ],
  ariaLabels: { linkedin: "Vai al profilo LinkedIn", github: "Vai al profilo GitHub" },
};

describe("FooterView", () => {
  it("è un contentinfo, così gli assistivi lo saltano o ci arrivano a comando", () => {
    render(<FooterView {...props} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("l'email è cliccabile: chi non vuole compilare form deve poter scrivere subito", () => {
    render(<FooterView {...props} />);
    expect(screen.getByRole("link", { name: props.email })).toHaveAttribute(
      "href",
      `mailto:${props.email}`,
    );
  });

  it("i link social hanno un nome accessibile, non solo un'icona", () => {
    render(<FooterView {...props} />);
    expect(screen.getByRole("link", { name: props.ariaLabels.linkedin })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: props.ariaLabels.github })).toBeInTheDocument();
  });

  it("mostra l'anno corrente nel copyright", () => {
    render(<FooterView {...props} />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeVisible();
  });

  it("la busta è indirizzata: nome, email e città stanno nello stesso blocco", () => {
    // Il senso della proposta e' che la mail smetta di essere un link in fondo
    // e diventi la riga di un indirizzo. Se i tre pezzi si separano, resta un
    // disegno di busta con dentro un piede qualsiasi.
    render(<FooterView {...props} />);
    const indirizzo = screen.getByTestId("busta-indirizzo");
    expect(within(indirizzo).getByText(props.rispondiA)).toBeVisible();
    expect(within(indirizzo).getByText(props.name)).toBeVisible();
    expect(within(indirizzo).getByRole("link", { name: props.email })).toBeVisible();
    expect(within(indirizzo).getByText(props.citta)).toBeVisible();
  });

  it("la tagline resta nel piede: è l'unico posto del sito in cui esiste", () => {
    // Il prototipo della busta l'aveva persa per strada. E' la sola frase che
    // dice cosa fa e da dove, e non compare in nessun'altra sezione.
    render(<FooterView {...props} />);
    expect(screen.getByText(props.tagline)).toBeVisible();
  });

  it("il blocco dei profili non si chiama «mittente»: il mittente sarebbe chi scrive", () => {
    // Su una busta indirizzata ad Andrea il mittente e' il visitatore, non lui.
    // L'etichetta dice cosa c'e' davvero li' dentro: altri posti dove trovarlo.
    render(<FooterView {...props} />);
    const profili = screen.getByTestId("busta-profili");
    expect(within(profili).getByText(props.ancheQui)).toBeVisible();
    expect(screen.queryByText(/mittente/i)).not.toBeInTheDocument();
  });

  it("l'affrancatura è decorativa e sta fuori dall'albero accessibile", () => {
    // Francobollo e annullo non aggiungono niente a chi ascolta la pagina: la
    // citta' e' gia' nella riga dell'indirizzo, e il resto e' disegno. Un nome
    // accessibile qui sarebbe rumore letto due volte.
    render(<FooterView {...props} />);
    expect(screen.getByTestId("busta-affrancatura")).toHaveAttribute("aria-hidden", "true");
  });

  it("l'annullo porta la data di oggi in gg.mm.aa, non una data cablata", () => {
    // Un timbro postale con una data ferma invecchia a vista: a distanza di
    // mesi dice solo che la pagina non si tocca da un pezzo.
    render(<FooterView {...props} />);
    const oggi = new Date();
    const gg = String(oggi.getDate()).padStart(2, "0");
    const mm = String(oggi.getMonth() + 1).padStart(2, "0");
    const aa = String(oggi.getFullYear()).slice(-2);
    expect(screen.getByTestId("busta-annullo-data")).toHaveTextContent(`${gg}.${mm}.${aa}`);
  });

  it("il copyright sta DENTRO la busta: fuori non c'e' piu' niente in cui stare", () => {
    // La busta riempie tutto il piede, quindi il blocco scuro che prima
    // ospitava questa riga non esiste piu'. Se restasse fuori, finirebbe su
    // una striscia alta zero e sparirebbe dalla pagina.
    render(<FooterView {...props} />);
    const busta = screen.getByTestId("busta");
    expect(within(busta).getByText(new RegExp(String(new Date().getFullYear())))).toBeVisible();
  });

  it("la busta e' l'unico figlio del piede: e' lei a occuparlo tutto", () => {
    // Il senso della modifica: niente cornice, niente incassatura, niente
    // contenitore intermedio che la rimpicciolisca.
    render(<FooterView {...props} />);
    const piede = screen.getByRole("contentinfo");
    expect(piede.children).toHaveLength(1);
    expect(piede.firstElementChild).toBe(screen.getByTestId("busta"));
  });
});
