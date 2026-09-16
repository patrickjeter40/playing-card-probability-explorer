# Playing Card Probability Explorer

A compact research tool for choosing numeric targets and measuring the number of card choices available to a player.

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
