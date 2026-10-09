import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { FooterView } from "../FooterView";

const props = {
  tagline: "Costruisco software per il web. Da Torino, per chi ha un'attività da far crescere.",
  replyTo: "Rispondi a",
  alsoHere: "Anche qui",
  city: "10100 Torino (TO), Italia",
  office: "TORINO",
  country: "ITALIA",
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("l'anno del copyright e' quello della visita, non quello della build", () => {
    // Una data finta lontana dalla build distingue l'anno della visita.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2031, 2, 5) });
    render(<FooterView {...props} />);
    expect(screen.getByText(/© 2031 Andrea Ghidara/)).toBeVisible();
  });

  it("la busta è indirizzata: nome, email e città stanno nello stesso blocco", () => {
    // Separati, nome, email e citta' smetterebbero di essere un indirizzo.
    render(<FooterView {...props} />);
    const address = screen.getByTestId("envelope-address");
    expect(within(address).getByText(props.replyTo)).toBeVisible();
    expect(within(address).getByText(props.name)).toBeVisible();
    expect(within(address).getByRole("link", { name: props.email })).toBeVisible();
    expect(within(address).getByText(props.city)).toBeVisible();
  });

  it("la tagline resta nel piede: è l'unico posto del sito in cui esiste", () => {
    // E' la sola frase che dice cosa fa e da dove.
    render(<FooterView {...props} />);
    expect(screen.getByText(props.tagline)).toBeVisible();
  });

  it("il blocco dei profili non si chiama «mittente»: il mittente sarebbe chi scrive", () => {
    // Su una busta indirizzata ad Andrea il mittente e' il visitatore.
    render(<FooterView {...props} />);
    const profiles = screen.getByTestId("envelope-profiles");
    expect(within(profiles).getByText(props.alsoHere)).toBeVisible();
    expect(screen.queryByText(/mittente/i)).not.toBeInTheDocument();
  });

  it("l'affrancatura è decorativa e sta fuori dall'albero accessibile", () => {
    // La citta' e' gia' nell'indirizzo: qui sarebbe rumore letto due volte.
    render(<FooterView {...props} />);
    expect(screen.getByTestId("envelope-postage")).toHaveAttribute("aria-hidden", "true");
  });

  it("l'annullo porta la data di oggi in gg.mm.aa, non una data cablata", () => {
    // Un timbro con la data ferma invecchia a vista, e quella del server sarebbe della build.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2031, 2, 5) });
    render(<FooterView {...props} />);
    expect(screen.getByTestId("envelope-postmark-date")).toHaveTextContent("05.03.31");
  });

  it("l'html della build si idrata alla data della visita, senza errori", async () => {
    // L'html della build aperto mesi dopo: il primo render deve coincidere, o React segnala un mismatch.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2030, 0, 1) });
    const html = renderToString(<FooterView {...props} />);
    expect(html).not.toContain("2030");
    expect(html).not.toContain("01.01.30");

    vi.setSystemTime(new Date(2031, 2, 5));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    await act(async () => {
      hydrateRoot(host, <FooterView {...props} />);
    });

    expect(within(host).getByTestId("envelope-postmark-date")).toHaveTextContent("05.03.31");
    expect(within(host).getByText(/© 2031 Andrea Ghidara/)).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    host.remove();
  });

  it("il copyright sta DENTRO la busta: fuori non c'e' piu' niente in cui stare", () => {
    // Fuori dalla busta finirebbe su una striscia alta zero.
    render(<FooterView {...props} />);
    const envelope = screen.getByTestId("envelope");
    expect(within(envelope).getByText(new RegExp(String(new Date().getFullYear())))).toBeVisible();
  });

  it("la busta e' l'unico figlio del piede: e' lei a occuparlo tutto", () => {
    // Niente cornice ne' contenitore intermedio che la rimpicciolisca.
    render(<FooterView {...props} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.children).toHaveLength(1);
    expect(footer.firstElementChild).toBe(screen.getByTestId("envelope"));
  });
});
