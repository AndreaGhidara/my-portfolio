import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderConTesti } from "@/test/renderConTesti";
import it_ from "../../../../../../messages/it.json";
import { Schermo } from "../Schermo";
import { PALETTE_FINTE } from "../sitoFinto";

const t = it_.services.gioco.schermo;
const ATTREZZI = ["colori", "caratteri", "testi", "sezioni", "immagini", "telefono"] as const;

const banco = (container: HTMLElement) => container.querySelector('[data-gioco-livello="schermo"]') as HTMLElement;

const attrezzo = (k: (typeof ATTREZZI)[number]) =>
  within(screen.getByRole("group", { name: t.attrezzi })).getByRole("button", { name: new RegExp(t.attrezzo[k].nome) });

/** Le scelte del cassetto aperto: il gruppo porta il titolo dell'attrezzo. */
const scelte = (k: (typeof ATTREZZI)[number]) =>
  within(screen.getByRole("group", { name: t.attrezzo[k].titolo })).getAllByRole("button");

const viti = () => screen.queryAllByRole("button", { name: /svita la vite/ });

const avanza = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const clicca = (el: HTMLElement) => fireEvent.click(el);

/** Apre ogni attrezzo e ne prova una scelta. Il telefono si prova e si torna
 *  al computer, perche' le viti stanno sul portatile. */
function provaTutto() {
  for (const k of ATTREZZI) {
    clicca(attrezzo(k));
    const [, seconda] = scelte(k);
    clicca(seconda);
  }
  clicca(scelte("telefono")[0]);
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("livello 1, gli attrezzi", () => {
  it("una palette scelta e' premuta e passa al sito finto", () => {
    const { container } = renderConTesti(<Schermo onAvanti={() => {}} visibile />);

    expect(attrezzo("colori")).toHaveAttribute("aria-pressed", "true");
    const [bottega, notte] = scelte("colori");
    expect(bottega).toHaveAttribute("aria-pressed", "true");
    expect(banco(container).style.getPropertyValue("--sf")).toBe(PALETTE_FINTE[0].colori.fondo);

    clicca(notte);
    expect(notte).toHaveAttribute("aria-pressed", "true");
    expect(bottega).toHaveAttribute("aria-pressed", "false");
    expect(banco(container).style.getPropertyValue("--sf")).toBe(PALETTE_FINTE[1].colori.fondo);
    expect(attrezzo("colori")).toHaveClass("fatto");
  });

  it("aprire un altro attrezzo cambia il cassetto, e l'attrezzo e' fatto solo dopo una scelta", () => {
    renderConTesti(<Schermo onAvanti={() => {}} visibile />);

    clicca(attrezzo("sezioni"));
    expect(attrezzo("sezioni")).toHaveAttribute("aria-pressed", "true");
    expect(attrezzo("colori")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: t.attrezzo.sezioni.titolo })).toBeInTheDocument();
    expect(attrezzo("sezioni")).not.toHaveClass("fatto");

    clicca(scelte("sezioni")[1]);
    expect(attrezzo("sezioni")).toHaveClass("fatto");
  });

  it("il telefono porta la vista sul telefono, e un altro attrezzo la riporta al computer", () => {
    const { container } = renderConTesti(<Schermo onAvanti={() => {}} visibile />);

    clicca(attrezzo("telefono"));
    clicca(scelte("telefono")[1]);
    expect(banco(container)).toHaveAttribute("data-vista", "cell");

    clicca(attrezzo("colori"));
    expect(banco(container)).toHaveAttribute("data-vista", "pc");
  });
});

describe("livello 1, le viti", () => {
  it("compaiono solo quando tutti e sei gli attrezzi sono provati", () => {
    renderConTesti(<Schermo onAvanti={() => {}} visibile />);

    for (const k of ATTREZZI.slice(0, 5)) {
      clicca(attrezzo(k));
      clicca(scelte(k)[1]);
    }
    avanza(1000);
    expect(viti()).toHaveLength(0);

    clicca(attrezzo("telefono"));
    clicca(scelte("telefono")[0]);
    avanza(400);
    expect(viti()).toHaveLength(4);
  });

  it("finiti gli attrezzi sul telefono, le viti aspettano il ritorno al computer", () => {
    renderConTesti(<Schermo onAvanti={() => {}} visibile />);

    for (const k of ATTREZZI) {
      clicca(attrezzo(k));
      clicca(scelte(k)[1]);
    }
    avanza(1000);
    expect(viti()).toHaveLength(0);
    expect(screen.getByText(/Torna al computer/)).toBeInTheDocument();

    clicca(scelte("telefono")[0]);
    avanza(400);
    expect(viti()).toHaveLength(4);
  });

  it("svitate tutte e quattro, dopo 2,8 secondi passa al livello dopo", () => {
    const onAvanti = vi.fn();
    const { container } = renderConTesti(<Schermo onAvanti={onAvanti} visibile />);

    provaTutto();
    avanza(400);
    for (const v of viti()) clicca(v);
    expect(banco(container)).toHaveAttribute("data-aperto");

    avanza(2799);
    expect(onAvanti).not.toHaveBeenCalled();
    expect(banco(container)).toHaveAttribute("data-dietro");
    avanza(1);
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });

  it("fuori dallo schermo non passa, e al rientro i 2,8 secondi ripartono da capo", () => {
    const onAvanti = vi.fn();
    const { rerender } = renderConTesti(<Schermo onAvanti={onAvanti} visibile />);

    provaTutto();
    avanza(400);
    for (const v of viti()) clicca(v);
    avanza(2000);

    rerender(<Schermo onAvanti={onAvanti} visibile={false} />);
    avanza(5000);
    expect(onAvanti).not.toHaveBeenCalled();

    rerender(<Schermo onAvanti={onAvanti} visibile />);
    avanza(2799);
    expect(onAvanti).not.toHaveBeenCalled();
    avanza(1);
    expect(onAvanti).toHaveBeenCalledTimes(1);
  });

  it("smontato a meta', non passa piu'", () => {
    const onAvanti = vi.fn();
    const { unmount } = renderConTesti(<Schermo onAvanti={onAvanti} visibile />);

    provaTutto();
    avanza(400);
    for (const v of viti()) clicca(v);
    unmount();
    avanza(5000);
    expect(onAvanti).not.toHaveBeenCalled();
  });
});

describe("livello 1, in inglese", () => {
  it("le linguette e il cassetto parlano inglese", () => {
    renderConTesti(<Schermo onAvanti={() => {}} visibile />, { locale: "en" });
    expect(screen.getByRole("group", { name: "The tools" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Palette" })).toBeInTheDocument();
  });
});
