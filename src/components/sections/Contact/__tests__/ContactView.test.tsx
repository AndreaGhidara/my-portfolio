import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactView } from "../ContactView";

const props = {
  eyebrow: "Contatti",
  title: "Il tuo turno",
  client: { title: "Ho un progetto", body: "Raccontami cosa ti serve." },
  recruiter: {
    title: "Ti sto valutando per un ruolo",
    body: "Qui trovi il CV aggiornato.",
    cv: "Scarica il CV",
    linkedin: "LinkedIn",
    github: "GitHub",
  },
  cvPath: "/cv/Andrea_Ghidara_cv_2026.pdf",
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
  it("separa esplicitamente i due pubblici", () => {
    render(<ContactView {...props} />);
    expect(screen.getByRole("heading", { name: props.client.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: props.recruiter.title })).toBeInTheDocument();
  });

  it("l'uscita HR porta al CV con download esplicito", () => {
    render(<ContactView {...props} />);
    const cv = screen.getByRole("link", { name: props.recruiter.cv });
    expect(cv).toHaveAttribute("href", props.cvPath);
    expect(cv).toHaveAttribute("download");
  });

  it("l'uscita HR porta a LinkedIn e GitHub", () => {
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
    const { container } = render(<ContactView {...props} />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });
});
