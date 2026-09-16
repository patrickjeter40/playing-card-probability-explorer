# Evaluation: ability totals, party hands, and critical effects

## Recommended first prototype

**Start with six private cards per character, dealt from one shared deck, and three characters. Test card-count tiers as the primary power model; compare rank-based pattern criticals as an alternative.** This is a design recommendation for playtesting, not a proven combat optimum. It preserves meaningful target rarity without giving every character dozens of equivalent options. A three-character party starts with 18 cards in separate hands; four and five characters use 24 and 30 cards respectively, all feasible from one deck.

Try **15 or 21 for routine abilities, 31 for a stronger noncritical ability, 37 for a signature, and 39 for a rarer signature**. Per designated character, their exact opening probabilities at H=6 are 80.93%, 80.81%, 58.18%, 31.87%, and 23.53%. For a still rarer noncritical ability, 41 is 13.84%. If every ability must support criticals, replace 31 with 27 (73.55%) or 35 (40.85%), accepting that the rarity tier changes. Rank critical availability at H=6 is only about 1.06% of opening hands for 37 and 39; these bonuses will be uncommon.

Give every character a useful card-free fallback (movement, guard, basic attack) or an explicitly tested recovery action. A routine ability at 81% still fails about one hand in five. Its presence is not a guarantee of a useful legal target or of enough cards after another ability.

**For the shared-hand branch, try H=10 with three characters and a limited party action budget, rather than expecting every character to activate a card ability every round.** If three card-powered actions are a hard requirement, H=12 is the better tested starting point but still offers no guarantee. Four- or five-character parties need fallback actions, refill rules, a broader/cheaper ability menu, or a larger hand study. Shared H=10 and private H=6 do not have equal total card budgets; this is an intentional comparison of prototype rule packages, not an isolated test of sharing alone.

## Added rule: more cards, more power

[Read the card-count evaluation](card-count-evaluation.md) for the revised priority. At H=8, five-card 21 is available in 29.73% of hands; at H=10, 56.39%. This creates a paid upgrade, not necessarily a rare event. Total 31 can frequently upgrade through five cards even though it can never pattern-crit. Totals 41–50 always require five cards, so a universal five-card critical would apply to every successful activation.

The recommendations below for high totals concern the **rarity-based** variant. For the **card-count** variant, start with totals 15, 21, and 24 to compare different upgrade profiles. Keep these two design approaches distinct when pricing abilities.

## Scope and evidence

Every H=4–12 / K=2–5 combination was evaluated: [36-report overview](fixed-size-overview.md). All totals 2–50 are present, including impossible outcomes. These fixed-size reports are a reference; **the proposed activation rule must use the any-2–5 union**, not the sum of separate probabilities. There are also nine exact union reports, both critical definitions, 25 feasible party configurations, and spent-card studies.

Results concern opening hands with no mulligan, draw, discard, hand retention or refill. One deck serves the entire party; private hands are jointly dealt without replacement. All played cards must form the critical pattern. Runs are consecutive, Ace low, never wrapping. A character can use only its own hand in the private-hand model; there is no trading. Party critical-sharing effects and multi-round strategy are not modeled.

## 1. Allowing multiple card counts compresses rarity

| Hand size | Total 15 | Total 21 | Total 31 | Total 37 | Total 39 | Total 41 | Total 44 | Total 47 | Total 49 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | 46.98% | 30.05% | 5.40% | 1.56% | 0.83% | 0.00% | 0.00% | 0.00% | 0.00% |
| 5 | 67.68% | 60.33% | 25.83% | 10.81% | 7.21% | 3.16% | 1.56% | 0.64% | 0.28% |
| 6 | 80.93% | 80.81% | 58.18% | 31.87% | 23.53% | 13.84% | 6.87% | 2.88% | 1.28% |
| 7 | 89.23% | 90.13% | 81.59% | 56.93% | 45.89% | 32.14% | 16.95% | 7.42% | 3.43% |
| 8 | 94.23% | 95.05% | 92.12% | 76.01% | 66.00% | 52.73% | 30.81% | 14.46% | 6.96% |
| 9 | 97.07% | 97.62% | 96.67% | 87.71% | 80.41% | 70.14% | 46.17% | 23.59% | 11.93% |
| 10 | 98.58% | 98.91% | 98.62% | 94.07% | 89.44% | 82.49% | 60.74% | 34.08% | 18.16% |
| 11 | 99.34% | 99.52% | 99.43% | 97.27% | 94.61% | 90.32% | 73.00% | 45.01% | 25.35% |
| 12 | 99.71% | 99.79% | 99.77% | 98.79% | 97.37% | 94.90% | 82.37% | 55.59% | 33.12% |


At H=8, 15 / 21 / 31 occur in 94.23% / 95.05% / 92.12% of hands. That is three mostly available abilities, not a routine/strong/ultimate progression. For 31, the exactly-four-card report is 79.60%, but permitting five cards raises the union to 92.12%. At H=10 and H=12, the central totals become almost automatic before any cards are spent.

**Proposed playtest ladders:** these labels are design tiers, not mechanically mandated power levels. Probabilities are exact per starting hand, before spending.

| Prototype | Routine | Stronger | Signature | Rare |
| --- | --- | --- | --- | --- |
| Private H=5 | 15 (67.68%) | 21 (60.33%) | 31 (25.83%) | 35 (15.11%) |
| Private H=6 | 15 / 21 (80.93% / 80.81%) | 31 (58.18%) | 37 (31.87%) | 39 (23.53%) |
| Shared H=8 | 15 / 21 (94.23% / 95.05%) | 39 (66.00%) | 44 (30.81%) | 47 (14.46%) |
| Shared H=10 | 21 (98.91%) | 44 (60.74%) | 47 (34.08%) | 49 (18.16%) |
| Shared H=12 | 21 (99.79%) | 47 (55.59%) | 49 (33.12%) | 50 (27.72%; no rank crit) |


For private H=5, the routine tier is deliberately less reliable: consider it a stricter alternative after H=6. H=4 is poor for a flexible character kit and cannot play five-card abilities. H=7–8 private hands give more options but shift rarity to high totals. H=9–12 private hands largely erase scarcity for totals in the center of the deck distribution. Five private hands of 11 or 12 are impossible from one 52-card deck.

**High total is not automatically rare.** Tens are overrepresented, producing bumps at 20, 30, 40 and 50. At H=8, total 30 (97.77%) is easier than 21. Low totals can be rare too: total 2 is 10.72% at H=8 and 22.45% at H=12. But 2 uses only two aces and always crits under either definition; it is a different balance problem from a five-card ultimate. Compare both probability and card cost.

## 2. Decision Density is choice, not action count

At H=8, successful hands have 8.69 physical ways to make 21 and 7.38 ways to make 31. These subsets often overlap. Two fives plus one ten offer two ways to make 15 but permit only one activation.

| Hand | Target | At least two choices (sim.) | Two disjoint activations (sim.) |
| --- | --- | --- | --- |
| 8 | 15 | 89.94% | 61.96% |
| 8 | 21 | 93.80% | 50.32% |
| 8 | 31 | 89.94% | 2.00% |
| 8 | 41 | 34.82% | 0.00% |
| 10 | 15 | 97.14% | 83.98% |
| 10 | 21 | 98.24% | 85.72% |
| 10 | 31 | 98.26% | 47.60% |
| 10 | 41 | 72.82% | 0.44% |
| 12 | 15 | 99.30% | 95.12% |
| 12 | 21 | 99.72% | 95.96% |
| 12 | 31 | 99.74% | 88.76% |
| 12 | 41 | 92.68% | 16.02% |


This is why probability alone cannot price powerful abilities. Total 31 requires at least four cards, 41 requires five, and even a two-card 15 consumes cards another character may need. At H=8, two disjoint 31s occur only about 2% of hands despite about 90% offering multiple 31 combinations.

### Can everyone act from one shared hand?

The following simulation optimizes card allocation exactly **within each sampled hand** for an illustrative menu {15,21,31}. Every character may use any menu ability; each needs one activation and cards cannot be reused. This is generous relative to characters having subsets of this menu. It ignores movement, targets, cooldowns and ability usefulness. A different ability menu can change these numbers substantially.

| Shared H | Mean maximum activations | All 3 can act | All 4 can act | All 5 can act |
| --- | --- | --- | --- | --- |
| 6 | 1.28 | 0.34% | 0.00% | 0.00% |
| 8 | 1.99 | 19.12% | 0.10% | 0.00% |
| 10 | 2.72 | 69.58% | 9.10% | 0.00% |
| 12 | 3.48 | 89.24% | 56.98% | 3.82% |


The tested second menu {12,21,31,41} improves H=12 to about 65.68% for four characters and 10.68% for five, still far from reliable all-party activation. Full distributions are in [party-menu-capacity.csv](spending/party-menu-capacity.csv). A hand of H cards can never fund more than floor(H/2) activations under a minimum two-card rule, regardless of its Decision Density.

## 3. Shared and private hands are different economies

Four-character examples below are jointly simulated from one deck (10,000 parties per configuration). “All four” means every private hand can independently make that same total, so those four activations are disjoint. “At least one” is useful only if that ability is available to any of those characters; it does not describe a unique class ability assigned to one character. For a designated character use its individual exact hand probability.

| Private H | Total | H-card shared (exact) | At least one private character | All four private characters | Same-budget pooled (4H cards) |
| --- | --- | --- | --- | --- | --- |
| 4 | 21 | 30.05% | 76.23% | 0.96% | 100.00% |
| 4 | 31 | 5.40% | 20.22% | 0.00% | 100.00% |
| 4 | 41 | 0.00% | 0.00% | 0.00% | 99.81% |
| 6 | 21 | 80.81% | 99.92% | 40.92% | 100.00% |
| 6 | 31 | 58.18% | 97.20% | 11.09% | 100.00% |
| 6 | 41 | 13.84% | 46.22% | 0.00% | 100.00% |
| 8 | 21 | 95.05% | 100.00% | 81.48% | 100.00% |
| 8 | 31 | 92.12% | 99.99% | 72.28% | 100.00% |
| 8 | 41 | 52.73% | 96.55% | 4.98% | 100.00% |


Three distinct questions are kept separate:

1. **One H-card shared hand vs P private H-card hands:** private hands distribute P times as many cards. Higher party availability here cannot be attributed solely to hand privacy.
2. **Pool the same P×H cards:** pooling relaxes constraints and almost removes single-activation rarity for many targets. It does not establish that all characters can activate simultaneously.
3. **Character identity and competition:** private hands make ownership and scarcity local; a shared hand creates allocation choices but lets a specialist use cards drawn by anyone. Protecting a future ability can be a meaningful choice, but that is not quantified by initial achievability.

Do not estimate party availability as independent binomial draws: all hands share one finite deck. The saved party simulation accounts for this correlation. With five H=10 private hands, 50 cards are held and only two remain in the draw pile; retention and reshuffle rules would dominate subsequent turns.

## 4. Critical definitions substantially change balance

Rank definition: A–2–3 is a run; 9–10–J is a run totaling 29; Q–Q matches; 10–Q does not match. Numeric-value definition: 9–Q is a 9–10 run; 10–J–Q are three matching tens. All critical subsets still pay the ability's numeric total.

| Total | Ability H=8 (exact) | Rank critical / hand (sim.) | Value critical / hand (exact) | Rank critical given ability (sim.) |
| --- | --- | --- | --- | --- |
| 2 | 10.72% | 10.91% | 10.72% | 100.00% |
| 3 | 23.86% | 23.81% | 23.86% | 100.00% |
| 15 | 94.23% | 33.64% | 33.56% | 35.70% |
| 20 | 99.97% | 66.69% | 79.10% | 66.70% |
| 21 | 95.05% | 10.77% | 10.83% | 11.33% |
| 27 | 94.52% | 10.80% | 22.28% | 11.42% |
| 30 | 97.77% | 24.12% | 51.36% | 24.69% |
| 31 | 92.12% | 0.00% | 0.00% | 0.00% |
| 37 | 76.01% | 3.91% | 0.00% | 5.15% |
| 39 | 66.00% | 3.90% | 0.00% | 5.90% |
| 40 | 64.40% | 5.25% | 22.40% | 8.15% |
| 41 | 52.73% | 0.00% | 0.00% | 0.00% |
| 44 | 30.81% | 1.31% | 0.00% | 4.25% |
| 47 | 14.46% | 1.31% | 0.00% | 9.05% |
| 49 | 6.96% | 1.28% | 0.00% | 18.44% |
| 50 | 4.87% | 0.00% | 4.87% | 0.00% |


Rank columns use 100,000 physical-hand samples per H; value columns are exact combinatorial results. “Given ability” measures whether a successful hand offers at least one critical option. It is not the critical rate for a random subset or a player choosing optimally for future turns. The CSV includes conditional confidence intervals, which matter especially for rare targets.

### Structural gaps, proven by the complete pattern catalogue

- **No rank-based critical is possible for totals:** 23, 31, 33, 38, 41, 42, 43, 45, 46, 48, 50.
- **No numeric-value critical is possible for totals:** 23, 29, 31, 33, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49.
- In particular **31 and 41 cannot crit under either definition**, irrespective of hand size. Retain them as deliberately noncritical abilities or change their totals/rules.
- Rank high-end examples: 8–9–10–J = **37**; 9–10–J–Q = **39**; 7–8–9–10–J = **44**; 8–9–10–J–Q = **47**; 9–10–J–Q–K = **49**.
- Under numeric-value rules, the only critical total above 40 is **50**. It is five ten-valued cards, so every successful 50 is automatically critical. Under rank rules a five-of-a-kind cannot exist and the largest five-card rank run is 49, so 50 never crits.
- Totals 2 and 3 always crit when achievable under either definition (A–A and A–2). At total 20, even rank rules produce frequent critical opportunities because both equal face ranks and adjacent face-rank runs qualify when two-card criticals are allowed.

**Prefer rank-based criticals for this prototype.** They preserve face-card identity and support signature/ultimate runs in the high totals. Numeric-value matching magnifies the sixteen-ten concentration and makes 20/30/40 unusually critical-friendly while blocking most high-total run rewards. Rank rules still have target-dependent critical rates, so a uniform critical multiplier is not balanced automatically. If two-card criticals feel routine, test a three-card minimum as a separate rule change; these reports currently allow two-card runs and pairs.

## 5. Concrete next playtest

- Start with three characters, six private cards each, no trading. Assign different routine totals around 15/18/21, plus stronger targets from 31/35/37/39. Choose whether noncritical 31 is intentional. Keep routine damage available without cards.
- Compare a shared ten-card hand with three characters. Give 21 a routine role, 44 a stronger role, 47 a signature, and 49 a rare role. Expect roughly two to three card-funded actions for the studied menu, not automatic activation of the full party. Test a twelve-card variant if all three should usually act.
- Log: hand at each decision, character and ability availability, subset spent, critical opportunities and choices, number of useful remaining activations, fallback usage, time to choose, and whether cards were hoarded.
- Decide the refresh rule next: refill once per round, draw per action, retain unused cards, or discard all. These rules may overturn opening-hand rarity. Do not translate 1/probability directly into damage or expected waiting time for a persistent hand.
- Balance strength against opening availability, minimum cards spent, actual opportunity cost, critical frequency, target legality and cooldowns. These reports establish the combinatorial starting point, not an optimal damage curve.

## Evidence and uncertainty

[Report index](README.md) links every file. Numeric and numeric-value critical results are exact up to floating-point arithmetic. Rank criticals: 100,000 samples per H (worst-case marginal 95% margin about ±0.31 percentage points). Party: 10,000 per configuration (±0.98 points). Spending: 5,000 per H (±1.39 points). Use the saved Wilson intervals for individual probability estimates; these are not simultaneous guarantees across the whole study. Small differences within sampling uncertainty should not drive design decisions. Exact zero from a structural proof differs from zero observed in a simulation.
