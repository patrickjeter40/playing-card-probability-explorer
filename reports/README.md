# Tactical RPG card research

Start with [Card-count power evaluation](card-count-evaluation.md), [Evaluation and recommendations](evaluation.md), [interactive reference](review.html), or [all 36 fixed-size reports at a glance](fixed-size-overview.md).

## Report index

| Starting hand | Readable summary | Exactly 2 | Exactly 3 | Exactly 4 | Exactly 5 | Any 2–5 |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | [View](hand-04.md) | [CSV](exact/hand-04-play-2.csv) | [CSV](exact/hand-04-play-3.csv) | [CSV](exact/hand-04-play-4.csv) | [CSV](exact/hand-04-play-5.csv) | [CSV](exact/hand-04-any-2-to-5.csv) |
| 5 | [View](hand-05.md) | [CSV](exact/hand-05-play-2.csv) | [CSV](exact/hand-05-play-3.csv) | [CSV](exact/hand-05-play-4.csv) | [CSV](exact/hand-05-play-5.csv) | [CSV](exact/hand-05-any-2-to-5.csv) |
| 6 | [View](hand-06.md) | [CSV](exact/hand-06-play-2.csv) | [CSV](exact/hand-06-play-3.csv) | [CSV](exact/hand-06-play-4.csv) | [CSV](exact/hand-06-play-5.csv) | [CSV](exact/hand-06-any-2-to-5.csv) |
| 7 | [View](hand-07.md) | [CSV](exact/hand-07-play-2.csv) | [CSV](exact/hand-07-play-3.csv) | [CSV](exact/hand-07-play-4.csv) | [CSV](exact/hand-07-play-5.csv) | [CSV](exact/hand-07-any-2-to-5.csv) |
| 8 | [View](hand-08.md) | [CSV](exact/hand-08-play-2.csv) | [CSV](exact/hand-08-play-3.csv) | [CSV](exact/hand-08-play-4.csv) | [CSV](exact/hand-08-play-5.csv) | [CSV](exact/hand-08-any-2-to-5.csv) |
| 9 | [View](hand-09.md) | [CSV](exact/hand-09-play-2.csv) | [CSV](exact/hand-09-play-3.csv) | [CSV](exact/hand-09-play-4.csv) | [CSV](exact/hand-09-play-5.csv) | [CSV](exact/hand-09-any-2-to-5.csv) |
| 10 | [View](hand-10.md) | [CSV](exact/hand-10-play-2.csv) | [CSV](exact/hand-10-play-3.csv) | [CSV](exact/hand-10-play-4.csv) | [CSV](exact/hand-10-play-5.csv) | [CSV](exact/hand-10-any-2-to-5.csv) |
| 11 | [View](hand-11.md) | [CSV](exact/hand-11-play-2.csv) | [CSV](exact/hand-11-play-3.csv) | [CSV](exact/hand-11-play-4.csv) | [CSV](exact/hand-11-play-5.csv) | [CSV](exact/hand-11-any-2-to-5.csv) |
| 12 | [View](hand-12.md) | [CSV](exact/hand-12-play-2.csv) | [CSV](exact/hand-12-play-3.csv) | [CSV](exact/hand-12-play-4.csv) | [CSV](exact/hand-12-play-5.csv) | [CSV](exact/hand-12-any-2-to-5.csv) |

## Supporting studies

- [Card-count tiers](card-count/all-hands-tiers.csv): **exact**, 441 rows. Joint highest/lowest offered card-count tiers plus all cardinality marginals. Nine per-hand CSVs are in the same folder.
- [Party capacity by tier](card-count/party-capacity-by-tier.csv): spent-card constraints when only a particular effect tier may be used; 5,000 matched samples per H.

- [All-hand union probabilities](exact/all-hands-any-2-to-5.csv): **exact**, 441 rows.
- [Critical definitions](critical/all-hands-both-definitions.csv): 4,410 rows; rank definition **100,000-hand seeded simulation per H**, numeric-value definition **exact**. Contains fixed sizes and any-2–5 unions, run/match breakdown, critical probability, conditional critical availability, and 95% Wilson intervals for simulated results.
- [Critical pattern catalogue](critical/pattern-catalogue.csv): exhaustive structural list. A missing target is impossible to crit under that definition, not merely unobserved in simulation. Ranks use 1=A, 11=J, 12=Q, 13=K.
- [Shared vs private hands](party/shared-vs-private.csv): 10,000 jointly dealt parties per configuration; party sizes 3–5, individual hand sizes 4–12. Five hands of 11 or 12 cannot fit in one deck and are omitted. All 25 feasible configurations evaluated.
- [Repeated target, spent cards](spending/repeated-target.csv): 5,000 hands per H; two choices versus two **disjoint** activations, all totals.
- [Party menu capacity](spending/party-menu-capacity.csv): exact maximum disjoint packing within each of 5,000 sampled hands per H, for two explicitly stated example ability menus.
- [Manifest](manifest.json): sample counts, seeds, assumptions, generation time.

## Interpretation

CSV probabilities are fractions 0–1. Empty conditional metrics mean no successful hands; exact results have blank simulation counts and confidence intervals. Critical availability is the chance a hand offers a critical play; it is not the rate at which a player chooses that play. Run and match probabilities can overlap within a hand; use the union column. Decision Density counts physical choices, not consecutive activations or necessarily tactically distinct decisions.

All hands are opening deals from one deck with no replacement, draws, discards, retention, or refills. Card value is A=1, 2–9 face value, 10/J/Q/K=10. Critical requires **all** played cards to match or form a consecutive run; no wraparound and Ace low. Suits do not matter. A card is never spent twice.

Simulation intervals are per estimate, not simultaneous guarantees over thousands of cells. Worst-case approximate 95% probability margins: critical rank study ±0.31 percentage points; party study ±0.98 points; spending study ±1.39 points. Conditional intervals can be much wider for rare targets. Zero sampled successes is not proof of impossibility; consult the pattern catalogue or card-count constraints. Rounded 100% estimates are not exact guarantees.

## Reproduce

From the project root, after npm install:

```sh
npm test
npm run typecheck
node scripts/generate-reports.mjs
node scripts/summarize-reports.mjs
```

The generator reuses the app's exact engine and PRNG, and bundles TypeScript with the esbuild installed by Vite. It enumerates weighted numeric hands once per H for all four play sizes, checks expected subset counts against choose(H,k), validates numeric-value critical simulations against exact enumeration, and checks critical events imply ability events. Research tests independently enumerate physical subsets for both critical definitions and verify disjoint-card packing. The report pages use the app's existing dark palette, teal accents, and typography hierarchy.
