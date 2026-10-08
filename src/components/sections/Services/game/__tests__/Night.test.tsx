import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { renderWithMessages } from "@/test/renderWithMessages";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Night } from "../Night";
import { NIGHT_DURATION } from "../nightData";

const n = it_.services.gioco.notte;
const VOCI = ["dominio", "sicurezza", "dati", "copie", "dove", "velocita"] as const;

const interruttore = (k: (typeof VOCI)[number]) => screen.getByRole("button", { name: n.voci[k] });
const orologio = (container: HTMLElement) => container.querySelector("[data-night-time]")?.textContent;
const vaiADormire = () => fireEvent.click(screen.getByRole("button", { name: new RegExp(n.prepara.vai) }));
const passa = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("la notte, la preparazione", () => {
  it("alle 23 sei interruttori spenti, e ognuno si accende e si spegne", () => {
    const { container } = renderWithMessages(<Night onNext={() => {}} visible />);
    expect(screen.getByRole("heading", { name: n.prepara.titolo })).toBeInTheDocument();
    expect(orologio(container)).toBe("23:00");
    for (const k of VOCI) expect(interruttore(k)).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(interruttore("copie"));
    expect(interruttore("copie")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(interruttore("copie"));
    expect(interruttore("copie")).toHaveAttribute("aria-pressed", "false");
  });
});

describe("la notte che corre", () => {
  it("corre da sola dalle 23 alle 7, e la mattina c'e' il resoconto", () => {
    const { container } = renderWithMessages(<Night onNext={() => {}} visible />);
    vaiADormire();
    expect(screen.getByRole("heading", { name: n.corsa.titolo })).toBeInTheDocument();

    passa(NIGHT_DURATION / 2);
    expect(orologio(container)).toBe("03:00");
    expect(screen.queryByText(n.mattina.occhiello)).toBeNull();

    passa(NIGHT_DURATION / 2);
    expect(orologio(container)).toBe("07:00");
    expect(screen.getByText(n.mattina.occhiello)).toBeInTheDocument();
  });

  it("con tutto pronto il sito c'e' otto ore su otto, e ogni evento e' parato", () => {
    const { container } = renderWithMessages(<Night onNext={() => {}} visible />);
    for (const k of VOCI) fireEvent.click(interruttore(k));
    vaiADormire();
    passa(NIGHT_DURATION);

    expect(screen.getByRole("heading", { name: n.mattina.tutto })).toBeInTheDocument();
    const cronaca = container.querySelector("[data-night-log]") as HTMLElement;
    expect(within(cronaca).getAllByText(n.parato)).toHaveLength(6);
    expect(within(cronaca).queryByText(n.giu)).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(n.mattina.rifai) })).toBeInTheDocument();
  });

  it("con niente pronto il sito va giu': meno ore, e sei «giu'»", () => {
    const { container } = renderWithMessages(<Night onNext={() => {}} visible />);
    vaiADormire();
    passa(NIGHT_DURATION);

    expect(screen.getByRole("heading", { name: "Il sito c'è stato 0,8 ore su 8" })).toBeInTheDocument();
    const cronaca = container.querySelector("[data-night-log]") as HTMLElement;
    expect(within(cronaca).getAllByText(n.giu)).toHaveLength(6);
    expect(screen.getByText("giù 3 ore")).toBeInTheDocument();
    expect(screen.getByText("giù 24 min")).toBeInTheDocument();
  });

  it("fuori dallo schermo l'orologio si ferma, e al rientro riparte da li'", () => {
    const { container, rerender } = renderWithMessages(<Night onNext={() => {}} visible />);
    vaiADormire();
    passa(NIGHT_DURATION / 4);
    expect(orologio(container)).toBe("01:00");

    rerender(<Night onNext={() => {}} visible={false} />);
    passa(NIGHT_DURATION);
    expect(orologio(container)).toBe("01:00");

    rerender(<Night onNext={() => {}} visible />);
    passa(NIGHT_DURATION / 4);
    expect(orologio(container)).toBe("03:00");
  });

  it("in StrictMode il tempo non corre doppio", () => {
    const { container } = renderWithMessages(
      <StrictMode>
        <Night onNext={() => {}} visible />
      </StrictMode>,
    );
    vaiADormire();
    passa(NIGHT_DURATION / 4);
    expect(orologio(container)).toBe("01:00");
  });

  it("smontato, non lascia timer accesi", () => {
    const { unmount } = renderWithMessages(<Night onNext={() => {}} visible />);
    vaiADormire();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("la mattina", () => {
  it("«prepara meglio» torna alle 23 tenendo le scelte", () => {
    const { container } = renderWithMessages(<Night onNext={() => {}} visible />);
    fireEvent.click(interruttore("dominio"));
    fireEvent.click(interruttore("dati"));
    vaiADormire();
    passa(NIGHT_DURATION);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(n.mattina.meglio) }));
    expect(screen.getByRole("heading", { name: n.prepara.titolo })).toBeInTheDocument();
    expect(orologio(container)).toBe("23:00");
    expect(interruttore("dominio")).toHaveAttribute("aria-pressed", "true");
    expect(interruttore("dati")).toHaveAttribute("aria-pressed", "true");
    expect(interruttore("copie")).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("[data-night-log]")?.children).toHaveLength(0);
  });

  it("«il finale» porta avanti", () => {
    const onAvanti = vi.fn();
    renderWithMessages(<Night onNext={onAvanti} visible />);
    vaiADormire();
    passa(NIGHT_DURATION);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(n.mattina.finale) }));
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });
});

describe("la notte in inglese", () => {
  it("il resoconto parla inglese, coi decimali col punto", () => {
    const e = en_.services.gioco.notte;
    renderWithMessages(<Night onNext={() => {}} visible />, { locale: "en" });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(e.prepara.vai) }));
    passa(NIGHT_DURATION);
    expect(screen.getByRole("heading", { name: "The site was up 0.8 hours of 8" })).toBeInTheDocument();
    expect(screen.getByText("down 1.5 h")).toBeInTheDocument();
  });
});
