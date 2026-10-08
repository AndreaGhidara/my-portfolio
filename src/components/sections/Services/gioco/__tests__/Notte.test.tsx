import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { renderConTesti } from "@/test/renderConTesti";
import it_ from "../../../../../../messages/it.json";
import en_ from "../../../../../../messages/en.json";
import { Notte } from "../Notte";
import { DURATA_NOTTE } from "../notteDati";

const n = it_.services.gioco.notte;
const VOCI = ["dominio", "sicurezza", "dati", "copie", "dove", "velocita"] as const;

const interruttore = (k: (typeof VOCI)[number]) => screen.getByRole("button", { name: n.voci[k] });
const orologio = (container: HTMLElement) => container.querySelector("[data-notte-ora]")?.textContent;
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
    const { container } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
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
    const { container } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    vaiADormire();
    expect(screen.getByRole("heading", { name: n.corsa.titolo })).toBeInTheDocument();

    passa(DURATA_NOTTE / 2);
    expect(orologio(container)).toBe("03:00");
    expect(screen.queryByText(n.mattina.occhiello)).toBeNull();

    passa(DURATA_NOTTE / 2);
    expect(orologio(container)).toBe("07:00");
    expect(screen.getByText(n.mattina.occhiello)).toBeInTheDocument();
  });

  it("con tutto pronto il sito c'e' otto ore su otto, e ogni evento e' parato", () => {
    const { container } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    for (const k of VOCI) fireEvent.click(interruttore(k));
    vaiADormire();
    passa(DURATA_NOTTE);

    expect(screen.getByRole("heading", { name: n.mattina.tutto })).toBeInTheDocument();
    const cronaca = container.querySelector("[data-notte-cronaca]") as HTMLElement;
    expect(within(cronaca).getAllByText(n.parato)).toHaveLength(6);
    expect(within(cronaca).queryByText(n.giu)).toBeNull();
    expect(screen.getByRole("button", { name: new RegExp(n.mattina.rifai) })).toBeInTheDocument();
  });

  it("con niente pronto il sito va giu': meno ore, e sei «giu'»", () => {
    const { container } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    vaiADormire();
    passa(DURATA_NOTTE);

    expect(screen.getByRole("heading", { name: "Il sito c'è stato 0,8 ore su 8" })).toBeInTheDocument();
    const cronaca = container.querySelector("[data-notte-cronaca]") as HTMLElement;
    expect(within(cronaca).getAllByText(n.giu)).toHaveLength(6);
    expect(screen.getByText("giù 3 ore")).toBeInTheDocument();
    expect(screen.getByText("giù 24 min")).toBeInTheDocument();
  });

  it("fuori dallo schermo l'orologio si ferma, e al rientro riparte da li'", () => {
    const { container, rerender } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    vaiADormire();
    passa(DURATA_NOTTE / 4);
    expect(orologio(container)).toBe("01:00");

    rerender(<Notte onAvanti={() => {}} visibile={false} />);
    passa(DURATA_NOTTE);
    expect(orologio(container)).toBe("01:00");

    rerender(<Notte onAvanti={() => {}} visibile />);
    passa(DURATA_NOTTE / 4);
    expect(orologio(container)).toBe("03:00");
  });

  it("in StrictMode il tempo non corre doppio", () => {
    const { container } = renderConTesti(
      <StrictMode>
        <Notte onAvanti={() => {}} visibile />
      </StrictMode>,
    );
    vaiADormire();
    passa(DURATA_NOTTE / 4);
    expect(orologio(container)).toBe("01:00");
  });

  it("smontato, non lascia timer accesi", () => {
    const { unmount } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    vaiADormire();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("la mattina", () => {
  it("«prepara meglio» torna alle 23 tenendo le scelte", () => {
    const { container } = renderConTesti(<Notte onAvanti={() => {}} visibile />);
    fireEvent.click(interruttore("dominio"));
    fireEvent.click(interruttore("dati"));
    vaiADormire();
    passa(DURATA_NOTTE);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(n.mattina.meglio) }));
    expect(screen.getByRole("heading", { name: n.prepara.titolo })).toBeInTheDocument();
    expect(orologio(container)).toBe("23:00");
    expect(interruttore("dominio")).toHaveAttribute("aria-pressed", "true");
    expect(interruttore("dati")).toHaveAttribute("aria-pressed", "true");
    expect(interruttore("copie")).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("[data-notte-cronaca]")?.children).toHaveLength(0);
  });

  it("«il finale» porta avanti", () => {
    const onAvanti = vi.fn();
    renderConTesti(<Notte onAvanti={onAvanti} visibile />);
    vaiADormire();
    passa(DURATA_NOTTE);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(n.mattina.finale) }));
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });
});

describe("la notte in inglese", () => {
  it("il resoconto parla inglese, coi decimali col punto", () => {
    const e = en_.services.gioco.notte;
    renderConTesti(<Notte onAvanti={() => {}} visibile />, { locale: "en" });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(e.prepara.vai) }));
    passa(DURATA_NOTTE);
    expect(screen.getByRole("heading", { name: "The site was up 0.8 hours of 8" })).toBeInTheDocument();
    expect(screen.getByText("down 1.5 h")).toBeInTheDocument();
  });
});
