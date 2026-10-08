import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import it_ from "../../../../../../messages/it.json";
import { Screen } from "../Screen";
import { FAKE_PALETTES } from "../fakeSite";

const t = it_.services.gioco.schermo;
const TOOLS = ["colori", "caratteri", "testi", "sezioni", "immagini", "telefono"] as const;

const bench = (container: HTMLElement) => container.querySelector('[data-game-level="schermo"]') as HTMLElement;

const tool = (k: (typeof TOOLS)[number]) =>
  within(screen.getByRole("group", { name: t.attrezzi })).getByRole("button", { name: new RegExp(t.attrezzo[k].nome) });

const choices = (k: (typeof TOOLS)[number]) =>
  within(screen.getByRole("group", { name: t.attrezzo[k].titolo })).getAllByRole("button");

const screws = () => screen.queryAllByRole("button", { name: /svita la vite/ });

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const click = (el: HTMLElement) => fireEvent.click(el);

// Il telefono si prova e si torna al computer: le viti stanno sul portatile.
function tryAll() {
  for (const k of TOOLS) {
    click(tool(k));
    const [, second] = choices(k);
    click(second);
  }
  click(choices("telefono")[0]);
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("livello 1, gli attrezzi", () => {
  it("una palette scelta e' premuta e passa al sito finto", () => {
    const { container } = renderWithMessages(<Screen onNext={() => {}} visible />);

    expect(tool("colori")).toHaveAttribute("aria-pressed", "true");
    const [firstPalette, secondPalette] = choices("colori");
    expect(firstPalette).toHaveAttribute("aria-pressed", "true");
    expect(bench(container).style.getPropertyValue("--sf")).toBe(FAKE_PALETTES[0].colors.background);

    click(secondPalette);
    expect(secondPalette).toHaveAttribute("aria-pressed", "true");
    expect(firstPalette).toHaveAttribute("aria-pressed", "false");
    expect(bench(container).style.getPropertyValue("--sf")).toBe(FAKE_PALETTES[1].colors.background);
    expect(tool("colori")).toHaveClass("done");
  });

  it("aprire un altro attrezzo cambia il cassetto, e l'attrezzo e' fatto solo dopo una scelta", () => {
    renderWithMessages(<Screen onNext={() => {}} visible />);

    click(tool("sezioni"));
    expect(tool("sezioni")).toHaveAttribute("aria-pressed", "true");
    expect(tool("colori")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: t.attrezzo.sezioni.titolo })).toBeInTheDocument();
    expect(tool("sezioni")).not.toHaveClass("done");

    click(choices("sezioni")[1]);
    expect(tool("sezioni")).toHaveClass("done");
  });

  it("il telefono porta la vista sul telefono, e un altro attrezzo la riporta al computer", () => {
    const { container } = renderWithMessages(<Screen onNext={() => {}} visible />);

    click(tool("telefono"));
    click(choices("telefono")[1]);
    expect(bench(container)).toHaveAttribute("data-view", "cell");

    click(tool("colori"));
    expect(bench(container)).toHaveAttribute("data-view", "pc");
  });
});

describe("livello 1, le viti", () => {
  it("compaiono solo quando tutti e sei gli attrezzi sono provati", () => {
    renderWithMessages(<Screen onNext={() => {}} visible />);

    for (const k of TOOLS.slice(0, 5)) {
      click(tool(k));
      click(choices(k)[1]);
    }
    advance(1000);
    expect(screws()).toHaveLength(0);

    click(tool("telefono"));
    click(choices("telefono")[0]);
    advance(400);
    expect(screws()).toHaveLength(4);
  });

  it("finiti gli attrezzi sul telefono, le viti aspettano il ritorno al computer", () => {
    renderWithMessages(<Screen onNext={() => {}} visible />);

    for (const k of TOOLS) {
      click(tool(k));
      click(choices(k)[1]);
    }
    advance(1000);
    expect(screws()).toHaveLength(0);
    expect(screen.getByText(/Torna al computer/)).toBeInTheDocument();

    click(choices("telefono")[0]);
    advance(400);
    expect(screws()).toHaveLength(4);
  });

  it("svitate tutte e quattro, dopo 2,8 secondi passa al livello dopo", () => {
    const onNext = vi.fn();
    const { container } = renderWithMessages(<Screen onNext={onNext} visible />);

    tryAll();
    advance(400);
    for (const v of screws()) click(v);
    expect(bench(container)).toHaveAttribute("data-open");

    advance(2799);
    expect(onNext).not.toHaveBeenCalled();
    expect(bench(container)).toHaveAttribute("data-back");
    advance(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("fuori dallo schermo non passa, e al rientro i 2,8 secondi ripartono da capo", () => {
    const onNext = vi.fn();
    const { rerender } = renderWithMessages(<Screen onNext={onNext} visible />);

    tryAll();
    advance(400);
    for (const v of screws()) click(v);
    advance(2000);

    rerender(<Screen onNext={onNext} visible={false} />);
    advance(5000);
    expect(onNext).not.toHaveBeenCalled();

    rerender(<Screen onNext={onNext} visible />);
    advance(2799);
    expect(onNext).not.toHaveBeenCalled();
    advance(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("smontato a meta', non passa piu'", () => {
    const onNext = vi.fn();
    const { unmount } = renderWithMessages(<Screen onNext={onNext} visible />);

    tryAll();
    advance(400);
    for (const v of screws()) click(v);
    unmount();
    advance(5000);
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe("livello 1, in inglese", () => {
  it("le linguette e il cassetto parlano inglese", () => {
    renderWithMessages(<Screen onNext={() => {}} visible />, { locale: "en" });
    expect(screen.getByRole("group", { name: "The tools" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Palette" })).toBeInTheDocument();
  });
});
