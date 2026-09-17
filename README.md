# Playing Card Probability Explorer

A card-probability research tool with a playable generic tactical encounter.

## Play the prototype

Open [Tactical playtest](https://patrickjeter40.github.io/playing-card-probability-explorer/#playtest), or choose **Tactical playtest** in the app. Three offensive characters specialize in single-target damage, area damage, and ranged debuffs, with private six-card hands from one shared deck. Encounters default to eight enemies on a 10x10 grid; Dev tools can restart with 1-10. Each has three unique abilities: single target uses 15 / 21 / 24, area damage uses 13 / 22 / 31, and ranged debuffs uses 14 / 22 / 25 and one free exchange of any 1-6 cards before acting each turn; larger payments produce stronger effects and higher accuracy (70% / 80% / 90% / 100% for 2-5 cards; six-card plays have 100% base accuracy and crit for double the five-card damage). Characters may play abilities without a per-round limit while they can pay. Basic costs any two cards for 2 damage at range 5 and allows further actions. Suited numeric payments or rank runs of at least three cards redraw the number spent. After normal movement, Exert spends a same-rank pair to move up to 2 more tiles; it is repeatable, even after attacking. Guard is removed; choose End turn when finished. The ranged class applies accuracy and movement debuffs on hit. Twelve destructible walls provide directional cover: 1 HP reduces incoming hit chance by 20 points; 2 HP by 35. Flanking adds 15 points. Protected misses damage cover. Enemies use rifles (range 5) or an aggressive shotgun (range 3). See [PLAYTEST.md](PLAYTEST.md) for the complete rules, controls, assumptions, and session export format.

The probability explorer remains available at [#analysis](https://patrickjeter40.github.io/playing-card-probability-explorer/#analysis). Switching tabs preserves the current encounter; refreshing the page starts over.

## Run

Requires Node.js 22.12+ (or a supported newer version).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

```sh
npm test
npm run typecheck
npm run build
```

The production output is in `dist/`. Preview it locally with `npx vite preview --host 127.0.0.1`.

## Calculations

The standard 52-card deck retains physical identity, rank, and suit in `src/math/deck.ts`. Numeric analysis uses four cards at each value 1–9 and sixteen cards valued 10. All hands are dealt without replacement. Suits and ranks do not affect the initial numeric calculation.

For a hand, descending dynamic programming computes `ways[k][total]`: the number of distinct subsets of **physical cards** using exactly k cards. Descending updates prevent reuse. Two different fives paired with one ten give two ways to make 15; the order of cards within a subset does not create another way.

**Exact:** enumerate feasible value-count vectors, rather than all physical hands. A vector with counts `c[v]` has weight `product(choose(deckCount[v], c[v]))`. These weights sum to `choose(52, handSize)` and yield exact combinatorial probabilities (subject to ordinary floating-point rounding). Every physical hand within a vector has identical numeric subset counts.

**Monte Carlo:** a seeded PRNG and partial Fisher–Yates shuffle sample physical hands uniformly without replacement. A seed makes results reproducible. The displayed probability margin is the worst-case approximate per-estimate 95% binomial margin, `1.96 * sqrt(0.25 / samples)`. It is not a simultaneous interval for all cells, nor an uncertainty bound for ways or density. Rare targets can remain unseen; increase the sample count or use exact analysis.

- **Achievability Probability:** fraction of hands containing at least one matching subset.
- **Average Ways:** expected matching subset count over all hands, including failures.
- **Decision Density:** Average Ways / Achievability Probability, equivalent to the mean subset count among successful hands. Shown as a dash when no success exists or was observed.
- **Any selected size:** union probability, calculated once per hand, not by adding probabilities. Ways and threshold metrics combine subsets from selected sizes. Subsets of different cardinalities are distinct.
- **At least 2 / 3 ways:** unconditional probability of that many valid subsets, including all selected sizes.

One hand can reach several totals, so probabilities across totals need not sum to 100%. Selecting no sizes gives zero union metrics; individual size statistics and comparison remain available. A play size larger than the starting hand has zero ways. Comparisons rank every total in the play size's numeric range, including impossible totals.

## Performance and structure

React + TypeScript + Vite, with Recharts. Pure calculation modules are separate from presentation. A Web Worker performs analysis and reports progress. Control changes terminate the old worker and clear old results to prevent stale statistics from appearing under a new configuration. Changing chart metric, targets, sorting, or comparison uses the already computed results immediately.

Exact work grows with hand size; 10–12 cards may take substantially longer. Monte Carlo gives a configurable speed/accuracy tradeoff (10,000, 100,000, or 1,000,000 hands). All four play sizes and totals 2–50 are calculated together. No independence assumptions or summed event probabilities are used.

Tests cover physical-card identity, face-card values, no reuse, independent bitmask counts, probability/ways/density distinctions, union thresholds, exact hypergeometric results, a complete independent enumeration of all four-card physical hands for target 15, and seeded simulation convergence.

Browser smoke checks in `scripts/browser-check.js` exercise chart modes, target add/remove, sorting, comparison, play-size columns, 12-card exact analysis, Monte Carlo sample counts, impossible play sizes, and empty selection. The file is an async browser function for the `chrome-devtools-axi eval` API; run it with the app open at its default settings. Desktop and 390px mobile layouts were inspected, and the production chart and background worker were verified in Chrome.

Suit-aware rules can use the retained Card model later; numeric grouping must be replaced or extended when suit or rank affects success. Custom decks, poker rules, and draw/discard mechanics are intentionally outside this version.

## Publishing

Live app: https://patrickjeter40.github.io/playing-card-probability-explorer/

Pushes to `main` run automated tests, TypeScript checks, and a production build before deploying to GitHub Pages. Pull requests run the same checks without deployment. The repository's Pages source is GitHub Actions. Relative asset URLs allow the app and calculation worker to run under the repository URL path.

## Exporting data

Use **Export CSV** beside Detailed results after calculation finishes. The download contains all totals in the table's current sort order, with metrics for the selected play sizes and their union. It includes hand size, exact/simulation mode, simulation sample count and seed when applicable, chart metric, and a highlighted-target flag. Both probabilities and average ways are included regardless of the active chart metric, along with Decision Density and the probability of at least two or three ways. Probability columns use full-precision fractions from 0 to 1; undefined Decision Density is blank. CSV export uses the displayed calculation without rerunning or resampling it.

## Saved research reports

The [report index](reports/README.md) links 36 exact hand-size/play-size reports, nine any-2–5 union reports, both critical definitions, shared/private party comparisons, spent-card capacity, and exact card-count effect tiers. Start with the [tactical RPG evaluation](reports/evaluation.md) and [power from cards spent](reports/card-count-evaluation.md), or open the standalone [interactive reference](reports/review.html).

Regenerate the numerical reports with `node scripts/generate-reports.mjs`, then regenerate the summaries with `node scripts/summarize-reports.mjs`. The studies are reproducible from the saved seeds and assumptions in `reports/manifest.json`.
