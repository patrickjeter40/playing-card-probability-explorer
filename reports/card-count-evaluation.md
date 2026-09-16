# Power from cards spent: a third rule model

## Revised recommendation

**Test card-count tiers as the primary power model first.** Keep the numeric total as the ability identity, then let the player buy a stronger effect by spending a larger valid subset. For example, 2 cards = basic, 3 = improved, 4 = powerful, 5 = empowered/critical. These are ordinal labels, not proposed damage multipliers. Compare rank-based pattern criticals in a separate variant before stacking both bonuses.

This is a stronger fit for deliberate party-resource decisions than assuming every stronger effect must be a rarer total. The trigger is visible and the cost is immediate. It can create a decision between one empowered activation and several ordinary activations. Whether that tradeoff is compelling depends on the actual effects, action limits, and refill rules; this study does not assign damage values.

**More cards always cost more resources. More cards do not always mean a rarer opportunity.** At H=8, total 30 is available with 3 cards in 47.17% of hands and with 5 cards in 68.58%. Total 15's 3-card version is also more common than its 2-card version. Increasing cardinality is not a universal difficulty curve.

## Exact availability at six cards per character

| Total | 2-card option | 3-card option | 4-card option | 5-card option | Any option | 5-card option given success |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | 67.82% | 35.35% | 5.99% | 0.32% | 78.21% | 0.41% |
| 15 | 55.38% | 51.57% | 14.36% | 1.16% | 80.93% | 1.43% |
| 20 | 60.80% | 59.69% | 33.24% | 5.49% | 98.26% | 5.59% |
| 21 | 0.00% | 68.10% | 36.53% | 6.89% | 80.81% | 8.53% |
| 24 | 0.00% | 48.91% | 46.94% | 12.23% | 78.77% | 15.53% |
| 27 | 0.00% | 31.45% | 48.13% | 18.23% | 73.55% | 24.78% |
| 30 | 0.00% | 26.08% | 42.40% | 22.97% | 75.36% | 30.48% |
| 31 | 0.00% | 0.00% | 42.46% | 23.90% | 58.18% | 41.07% |
| 39 | 0.00% | 0.00% | 7.28% | 17.61% | 23.53% | 74.86% |
| 41 | 0.00% | 0.00% | 0.00% | 13.84% | 13.84% | 100.00% |
| 44 | 0.00% | 0.00% | 0.00% | 6.87% | 6.87% | 100.00% |
| 47 | 0.00% | 0.00% | 0.00% | 2.88% | 2.88% | 100.00% |


For a six-card private hand, **21 is a good three-level ability candidate**: three-card payment is offered in 68.10% of opening hands, four-card in 36.53%, and five-card in 6.89%. The ability itself is usable in 80.81%. Two-card payment is impossible, so do not display a nonexistent two-card version in its UI.

For an ability with all four payment sizes, **15** is usable in 80.93%, but its five-card version is only 1.16%: exceptionally rare in an opening hand. Use **24** if a more frequent empowered option is desired (12.23% at H=6), knowing its cheapest payment is three cards. For H=6, the five-card payment also consumes five-sixths of that character's hand before any refill.

These probabilities overlap: one hand can offer several payment sizes. They are not mutually exclusive tiers. The next section classifies the strongest option each hand actually offers.

## Highest available tier, jointly calculated

The generator enumerates the complete hand, checks every allowed cardinality, and records its maximum. Each row below is a distribution summing to 100% (subject to rounding). It is **not** obtained by subtracting overlapping marginal probabilities. The player may still choose a cheaper available option; strongest offered is not strongest chosen.

| Hand | Total | No activation | Best tier 2 | Best tier 3 | Best tier 4 | Best tier 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | 15 | 19.07% | 25.47% | 40.59% | 13.71% | 1.16% |
| 6 | 21 | 19.19% | 0.00% | 41.19% | 32.72% | 6.89% |
| 6 | 24 | 21.23% | 0.00% | 26.01% | 40.52% | 12.23% |
| 6 | 31 | 41.82% | 0.00% | 0.00% | 34.28% | 23.90% |
| 8 | 15 | 5.77% | 13.65% | 41.88% | 31.44% | 7.26% |
| 8 | 21 | 4.95% | 0.00% | 22.17% | 43.15% | 29.73% |
| 8 | 24 | 4.58% | 0.00% | 11.00% | 39.73% | 44.69% |
| 8 | 31 | 7.88% | 0.00% | 0.00% | 21.52% | 70.60% |
| 10 | 15 | 1.42% | 5.53% | 30.83% | 42.30% | 19.92% |
| 10 | 21 | 1.09% | 0.00% | 8.49% | 34.03% | 56.39% |
| 10 | 24 | 0.84% | 0.00% | 3.29% | 23.51% | 72.37% |
| 10 | 31 | 1.38% | 0.00% | 0.00% | 7.26% | 91.36% |


The saved CSV also includes the mean minimum and maximum available card counts conditional on success, plus the joint probability of a two-card and five-card option. These distinguish an actual optional upgrade from a hand that can only activate by paying five cards.

## Eight-card shared hand: richer upgrades, tighter party budget

| Total | 2-card option | 3-card option | 4-card option | 5-card option | Any option | 5-card option given success |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | 85.07% | 61.94% | 19.43% | 2.28% | 92.56% | 2.46% |
| 15 | 72.86% | 77.53% | 38.04% | 7.26% | 94.23% | 7.71% |
| 20 | 78.23% | 83.66% | 66.37% | 25.08% | 99.97% | 25.09% |
| 21 | 0.00% | 90.18% | 70.30% | 29.73% | 95.05% | 31.28% |
| 24 | 0.00% | 74.58% | 81.31% | 44.69% | 95.42% | 46.84% |
| 27 | 0.00% | 52.86% | 82.54% | 58.76% | 94.52% | 62.17% |
| 30 | 0.00% | 47.17% | 77.59% | 68.58% | 97.77% | 70.15% |
| 31 | 0.00% | 0.00% | 79.60% | 70.60% | 92.12% | 76.64% |
| 39 | 0.00% | 0.00% | 20.03% | 61.00% | 66.00% | 92.43% |
| 41 | 0.00% | 0.00% | 0.00% | 52.73% | 52.73% | 100.00% |
| 44 | 0.00% | 0.00% | 0.00% | 30.81% | 30.81% | 100.00% |
| 47 | 0.00% | 0.00% | 0.00% | 14.46% | 14.46% | 100.00% |


At H=8, five-card 21 is offered in 29.73% of all hands and 31.28% of successful hands. This is a much more frequent upgrade than with six cards. A five-card activation leaves only three cards for the rest of the party. At most one more minimum-two-card activation can follow from those remaining cards, and it may not make any useful target.

## Increasing hand size changes what "critical" means

| Hand | Total 15: five cards | Total 21: five cards | Total 24: five cards | Total 31: five cards |
| --- | --- | --- | --- | --- |
| 4 | 0.00% | 0.00% | 0.00% | 0.00% |
| 5 | 0.22% | 1.41% | 2.60% | 5.40% |
| 6 | 1.16% | 6.89% | 12.23% | 23.90% |
| 7 | 3.39% | 17.02% | 28.03% | 50.19% |
| 8 | 7.26% | 29.73% | 44.69% | 70.60% |
| 9 | 12.85% | 43.36% | 59.84% | 83.61% |
| 10 | 19.92% | 56.39% | 72.37% | 91.36% |
| 11 | 28.06% | 67.75% | 81.87% | 95.69% |
| 12 | 36.76% | 76.97% | 88.57% | 97.96% |


At H=10, five-card 21 is available in 56.39% of opening hands. At H=12 it reaches 76.97%. Calling this a rare critical would be misleading; it is a frequently offered paid upgrade. Choose "empowered" or "overcharged" if that better communicates the intended role.

## Card spending reduces how many characters can act

The following study uses menu {15,21,31}, one shared opening hand, and identical access for all actors. Each sampled hand is optimally packed without reusing cards. Each fixed-size row permits **only that payment tier** for every activation; it is a capacity comparison, not a prediction of player behavior or an optimal damage policy. Samples: 5,000 per H with common shuffled hands across tier restrictions. Only total 15 is reachable in the two-card-only menu; compare that row with caution in the full CSV.

| Shared H | Allowed payment sizes | Mean maximum activations | At least 2 activations | At least 3 activations |
| --- | --- | --- | --- | --- |
| 8 | 2;3;4;5 | 1.98 | 80.52% | 19.00% |
| 8 | 3 | 1.55 | 60.22% | 0.00% |
| 8 | 4 | 1.07 | 11.74% | 0.00% |
| 8 | 5 | 0.76 | 0.00% | 0.00% |
| 10 | 2;3;4;5 | 2.73 | 94.20% | 70.64% |
| 10 | 3 | 2.25 | 87.28% | 39.32% |
| 10 | 4 | 1.85 | 85.72% | 0.00% |
| 10 | 5 | 1.00 | 6.14% | 0.00% |
| 12 | 2;3;4;5 | 3.49 | 98.42% | 89.22% |
| 12 | 3 | 2.81 | 96.14% | 76.52% |
| 12 | 4 | 2.12 | 96.26% | 16.38% |
| 12 | 5 | 1.57 | 58.84% | 0.00% |


At H=10, allowing all payment sizes supports about 2.73 activations on average in this menu; demanding five cards for every activation supports about 1.00. Two five-card activations are feasible in only about 6.14% of sampled hands. Five-card effects therefore impose a real party opportunity cost even when a single five-card target is common.

A ten-card shared hand can never fund three five-card activations without drawing more cards. A twelve-card hand can never fund three either. A party of five cannot all play five cards from a hand of twelve; high Decision Density does not change this card-count bound.

## Structural consequences for ability design

- **Totals 2–20:** can have a two-card base option, though the very smallest totals cannot reach all higher tiers. Total 5 cannot be made with five cards in this deck: five aces do not exist. A five-card total is at least 6.
- **Totals 21–30:** inherently require at least three cards. They can have three-, four-, and five-card versions.
- **Totals 31–40:** require at least four cards. Only four- and five-card versions exist.
- **Totals 41–50:** require exactly five cards. If "five cards means critical," every successful activation is critical; there is no lower-tier version. Treat these as fixed-cost ultimates rather than optional upgrades.
- **31 changes role between models:** impossible to pattern-crit under either run/match definition, yet its five-card version is offered in 70.60% of eight-card hands. A count-based critical at 31 would be common, not a subtle replacement for the pattern rule.
- A universal "2 weakest / 5 strongest" rule does not create the same upgrade range for every total. Use ability-specific tier labels if the base payment starts at three or four cards.
- Do not price a 41 ability as though both its high total and its automatic five-card tier were independent rarity gates. They describe the same requirement.

## Compare the three power models

| Model | What gates power | What it encourages | Main pitfall |
| --- | --- | --- | --- |
| Rarer total | Opening-hand reachability | Finding a signature total | Large hands flatten rarity; availability changes after spending |
| Run/match critical | Particular structure within a successful subset | Saving and arranging patterns | Some totals never crit; ten-valued cards distort value matching |
| More-card effect | A larger legal payment for the same total | Buying impact with card budget | Five-card options can be common; some totals force five cards |


**Suggested first comparison:** retain a six-card private-hand prototype and an eight- or ten-card shared-hand prototype. Give a 15 ability multiple sizes, a 21 ability three sizes, and a 24 ability a more accessible five-card upgrade. Keep fixed high-total ultimates separate from optional upgrades. Allow card-free fallback actions. Playtest whether players voluntarily pay four or five cards when cheaper options and other characters' actions are available.

Avoid initially multiplying all three reward axes together. Use card-count tiers for power, and optionally let a rank run/match add a modest distinct rider (for example repositioning or a debuff) rather than another large multiplier; this is a proposed design experiment, not a measured balance result. The right effect scaling cannot be inferred from probability alone.

## Files and limits

- [All exact card-count tiers](card-count/all-hands-tiers.csv), with separate per-H reports in the same folder.
- [Party capacity by payment tier](card-count/party-capacity-by-tier.csv).
- [Original critical, total-rarity, and party-hand evaluation](evaluation.md).

All availability and joint tier distributions are exact. Capacity is a 5,000-hand simulation per H, with exact optimization inside each hand; worst-case per-probability 95% margin is about ±1.39 percentage points. Mean activation counts do not have that probability margin. The model has no refill, draw, discard, retention, class-specific loadout restrictions, targets, cooldowns, or damage scaling. Identical menu access is generous relative to narrower per-character menus. A different menu can change the capacities substantially.
