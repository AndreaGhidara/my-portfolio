# andreaghidara.dev

Il portfolio di Andrea Ghidara, sviluppatore web. È online su
[www.andreaghidara.dev](https://www.andreaghidara.dev), in italiano e in inglese.

È una pagina sola, fatta di sezioni:

- l'apertura, con il foglio che le scivola sopra;
- lo scontrino dei servizi;
- il tavolo degli attrezzi, che sul telefono diventa un gioco in quattro livelli;
- l'archivio dei lavori;
- il percorso dal 2023 a oggi;
- il bancone delle notizie;
- i contatti.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, Turbopack), React 19 e TypeScript.
- [next-intl](https://next-intl.dev) per l'italiano e l'inglese: i testi stanno in `messages/it.json` e `messages/en.json`.
- [GSAP](https://gsap.com) e [Lenis](https://lenis.darkroom.engineering) per le animazioni e lo scorrimento.
- Tailwind CSS 4 e fogli CSS globali, uno per sezione.
- [Resend](https://resend.com) per il modulo dei contatti; react-hook-form e zod per la validazione.
- [Vitest](https://vitest.dev) e Testing Library per i test.
- Pubblicato su Vercel.

## Avvio

```bash
npm install
npm run dev
```

Il sito risponde su [http://localhost:3777](http://localhost:3777) e reindirizza a `/it`.

Il server di sviluppo usa la porta **3777** e `npm start` la **3778**, non la solita 3000. Così il progetto può girare accanto a un altro senza contendersi la porta. Il numero è il `23.777` scritto sul post-it grigio del tavolo, più facile da ricordare di uno a caso. Si possono cambiare tutte e due:

```bash
PORT=4000 npm run dev
```

### Variabili d'ambiente

Vanno in un file `.env` nella radice del progetto, che git ignora.

| Variabile | Serve a | Obbligatoria |
|---|---|---|
| `RESEND_API_KEY` | spedire i messaggi del modulo dei contatti | sì, senza la pagina non si avvia |
| `GITHUB_TOKEN` | alzare il limite di richieste verso l'API di GitHub nel bancone delle notizie | no |

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo sulla 3777 |
| `npm run build` | build di produzione |
| `npm start` | serve la build sulla 3778 |
| `npm run typecheck` | controllo dei tipi |
| `npm run lint` | ESLint |
| `npm test` | tutti i test, una volta |
| `npm run test:watch` | test in ascolto |
| `npm run assets` | rigenera le immagini in `public/` partendo da `assets-source/` e dagli script in `scripts/` |

## Struttura

```
messages/                testi in italiano e in inglese
assets-source/           immagini originali, prima della conversione
scripts/                 generano gli asset in public/ e src/content/works-shots.ts
src/
  app/                   layout, pagina, immagine Open Graph, sitemap
    api/notizie/         la raccolta delle notizie per il bancone
  components/
    sections/            una cartella per sezione (Hero, Receipt, Services, Works, ...)
    shell/               navigazione, scorrimento, tema e lingua
    brand/               firma, avatar e segni grafici
  content/               i dati del sito: lavori, percorso, servizi, attrezzi
  lib/news/              le fonti delle notizie e la loro raccolta
  animations/            preset GSAP e utilità di movimento
  styles/
    tokens.css           colori, misure e tipografia
    sections/            un foglio per sezione
    game/                i fogli del gioco
  test/                  strumenti comuni ai test
```

## Convenzioni

- Il codice è in inglese: nomi di file, componenti, variabili, attributi `data-*` e classi CSS.
- I commenti sono in italiano e dicono solo il perché che il codice non dice, in poche righe.
- I testi visibili stanno nei messaggi, in tutte e due le lingue.
- Niente trattino lungo, in nessun testo: un test lo controlla in `src/`, `scripts/` e `messages/`.
- Prima di un commit: `npm run typecheck`, `npm run lint` e `npm test`.
