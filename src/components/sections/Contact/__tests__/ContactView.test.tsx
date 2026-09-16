import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactView, type ContactViewProps } from "../ContactView";

const props: ContactViewProps = {
  eyebrow: "Contatti",
  title: "Il tuo turno",
  client: {
    eyebrow: "Ho un progetto",
    title: "Raccontami cosa ti serve",
    body: "Due righe bastano.",
  },
  dopo: {
    etichetta: "Cosa succede dopo",
    momenti: [
      { id: "risposta", quando: "Entro 24 ore", titolo: "Una risposta", testo: "Anche se è no." },
      { id: "chiamata", quando: "Se ci sentiamo", titolo: "Mezz'ora", testo: "Senza impegno." },
      { id: "preventivo", quando: "Solo dopo", titolo: "Due pagine", testo: "E i numeri." },
    ],
  },
  recruiter: {
    eyebrow: "L'altra uscita",
    title: "Mi stai valutando per un ruolo?",
    body: "Allora non ti serve un modulo.",
    cv: "Scarica il CV",
    linkedin: "LinkedIn",
    github: "GitHub",
  },
  cvPath: "/cv/Andrea_Ghidara_CV_2026.pdf",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ],
  form: {
    labels: { name: "Come ti chiami", email: "La tua email", message: "Cosa ti serve" },
    placeholders: { name: "Mario Rossi", email: "mario@esempio.it", message: "Ciao Andrea…" },
    button: { default: "Invia messaggio", sending: "Invio in corso…" },
    status: { success: "Messaggio ricevuto.", error: "Qualcosa è andato storto." },
    errors: {
      nameRequired: "Serve un nome.", nameMin: "Almeno 2 caratteri.",
      emailRequired: "Serve un'email.", emailInvalid: "Email non valida.",
      messageRequired: "Scrivi due righe.", messageMin: "Almeno 10 caratteri.",
    },
  },
};

describe("ContactView", () => {
  it("i due pubblici restano distinti, ma non sono più due colonne pari", () => {
    // Il cliente ha metà pagina e un foglio su cui scrivere; chi assume ha una
    // riga sola e un tesserino. Erano due colonne uguali fra cui scegliere:
    // adesso una è il posto dove si scrive e l'altra è una cosa che trovi dopo.
    const { container } = render(<ContactView {...props} />);
    expect(screen.getByRole("heading", { name: props.client.title })).toBeInTheDocument();
    const tesserino = container.querySelector("[data-contact-badge]");
    expect(tesserino).not.toBeNull();
    expect(tesserino).toHaveTextContent(props.recruiter.title);
    expect(container.querySelector("[data-contact-foglio] form")).not.toBeNull();
  });

  it("«cosa succede dopo» è una sequenza, e il markup lo dice", () => {
    // I tre momenti hanno un ordine nel tempo: entro 24 ore, poi la chiamata,
    // poi il preventivo. Una <ol> è il modo in cui quell'ordine arriva anche a
    // chi la pagina non la vede.
    const { container } = render(<ContactView {...props} />);
    const voci = container.querySelectorAll("ol[data-contact-tempi] > li");
    expect(voci).toHaveLength(props.dopo.momenti.length);
    expect(voci[0]).toHaveTextContent(props.dopo.momenti[0].quando);
    expect(voci[voci.length - 1]).toHaveTextContent("Due pagine");
  });

  it("l'uscita per chi assume porta al CV con download esplicito", () => {
    render(<ContactView {...props} />);
    const cv = screen.getByRole("link", { name: props.recruiter.cv });
    expect(cv).toHaveAttribute("href", props.cvPath);
    expect(cv).toHaveAttribute("download");
  });

  it("l'uscita per chi assume porta a LinkedIn e GitHub", () => {
    render(<ContactView {...props} />);
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", props.socials[0].url);
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", props.socials[1].url);
  });

  it("il form ha tre campi, non sei: ogni campo in più è gente che se ne va", () => {
    render(<ContactView {...props} />);
    expect(screen.getByLabelText(props.form.labels.name)).toBeInTheDocument();
    expect(screen.getByLabelText(props.form.labels.email)).toBeInTheDocument();
    expect(screen.getByLabelText(props.form.labels.message)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
  });

  it("l'esito dell'invio è annunciato alla tecnologia assistiva", () => {
    render(<ContactView {...props} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("ogni campo invalido è associato al proprio messaggio d'errore", async () => {
    render(<ContactView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: props.form.button.default }));
    const nome = screen.getByLabelText(props.form.labels.name);
    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(nome).toHaveAccessibleDescription(props.form.errors.nameRequired);
  });

  it("il filo attraversa la sezione", () => {
    const { container } = render(<ContactView {...props} />);
    expect(container.querySelector('[data-thread="contact"]')).not.toBeNull();
  });
});

describe("i campi sono righe, non riquadri", () => {
  const css = readFileSync("src/styles/tokens.css", "utf8");
  const regole = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selettore, corpo]) => ({ selettore: selettore.trim(), corpo }))
    .filter((r) => /\[data-contact-campo\]/.test(r.selettore));

  it("un campo senza bordo ha comunque un fuoco che si vede", () => {
    // È il prezzo della riga al posto della scatola: tolto il contorno, il
    // fuoco della tastiera resta l'unica cosa che dice dove sei, e senza una
    // regola esplicita il browser non ne disegna nessuno su un campo così.
    const fuoco = regole.find((r) => /:focus-visible/.test(r.selettore));
    expect(fuoco, "manca la regola di fuoco sui campi").toBeDefined();
    expect(fuoco!.corpo).toMatch(/outline:[^;]*var\(--accent\)/);
  });

  it("il campo resta grande abbastanza da poterlo toccare", () => {
    // Una riga e' alta quanto il testo. Su un telefono si tocca con il pollice,
    // e sotto i 44px il bersaglio e' troppo piccolo: la min-height e' quello
    // che una scatola dava gratis e una riga no.
    const base = regole.find((r) => r.selettore === "[data-contact-campo]");
    expect(base, "manca la regola base dei campi").toBeDefined();
    expect(base!.corpo).toMatch(/min-height:\s*2\.75rem/);
  });
});
