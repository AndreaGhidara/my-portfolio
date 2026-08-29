import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterView } from "../FooterView";

const props = {
  tagline: "Costruisco software per il web.",
  emailLabel: "Email",
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
});
