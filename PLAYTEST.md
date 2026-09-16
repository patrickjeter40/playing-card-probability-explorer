# Tactical playtest

Open the app at `#playtest` (the default view). The probability explorer remains at `#analysis`; switching workspace tabs preserves the encounter and explorer configuration. Reloading starts a fresh game.

## Goal and controls

Defeat all three enemies before all three party members are defeated. Select a character from the party strip or board. Click **Move** and a highlighted tile for optional movement, then choose one action. For a card ability, select physical cards manually or use a payment suggestion, select an eligible target, and confirm. **Resolve enemy phase** advances the round after everyone acts; **End round early** explicitly confirms skipped activations.

The board is 7×7. Movement and range use orthogonal distance. Walls block movement and line of sight, including sightlines touching blocked corners. Units block movement but not sight. Defeated units leave the board and cannot be healed.

## Party abilities

Each character has one character-specific numeric ability. All powers are provisional playtest values.

| Character | Total | Range | 2 cards | 3 cards | 4 cards | 5 cards (empowered) |
| --- | --- | --- | --- | --- | --- | --- |
| A: Impact, 12 HP | 15 | 3 | 3 damage | 4 damage | 6 damage | 8 damage |
| B: Control, 10 HP | 21 | 4 | Impossible | 3 damage; stop movement | 4 damage; stop movement | 6 damage; skip entire enemy turn |
| C: Restore, 10 HP | 24 | 3 | Impossible | Heal 3 | Heal 5 | Heal 7 and grant 2 shield |

Restore can target the user. Healing cannot exceed maximum HP. A full-health unit is eligible only if the empowered shield improves its protection. Shields do not add together: the higher value is retained. Shield expires after the enemy phase.

There are no suit, run, matching-rank, or random critical bonuses. Five-card power is an explicit paid upgrade, with no extra multiplier beyond the listed effect.

## Round economy

- One standard 52-card deck supplies three **private** six-card hands. A=1; 2–9 face value; 10/J/Q/K=10.
- Each character may move once, up to three steps, **before** taking one action. Movement costs no cards. Characters may be selected in any order, including interleaving their moves.
- Card abilities spend 2–5 distinct cards from the acting character's hand whose values sum exactly to that character's total.
- **Basic:** 2 damage, range 2, no cards, spends the action.
- **Guard:** gain 3 shield, keep all cards, spends the action.
- **Exchange:** discard 1–3 selected cards and draw replacements immediately, spends the action. It is a deliberate way out of a bad hand.
- After the party, enemies resolve in E1 → E2 → E3 order. Their current intentions are shown, but later enemies re-plan after earlier movement and defeats.
- Then living characters retain unused cards and refill to six. Refill priority rotates each round. Spent, exchanged, and defeated characters' held cards share one discard pile; it is shuffled into the draw pile only when that pile empties.
- An exchanged card can be drawn again if the draw pile empties and its discard is reshuffled during that exchange.

**Important experimental assumption:** full round-end refill makes high-card payments a tradeoff in retained card composition and future options, not a persistent hand-size penalty. Private hands also prevent one character's payment from directly consuming another's current hand. If taking the largest available payment becomes automatic, test a limited draw per round or a shared-hand variant next. Neither alternative is implemented in this baseline.

## Enemies and ending

E1 and E2 each have 10 HP, move up to 2, and attack for 3 at range 1. E3 has 10 HP, moves 1, and attacks for 2 at range 3. Enemies prefer an attack reachable with the least movement, with deterministic proximity and ID tie-breaks. Otherwise they advance along a shortest legal path toward a firing position. Control's movement stop does **not** prevent an attack already in range. Empowered Control skips the entire next enemy turn.

Victory occurs immediately when the last enemy falls. Defeat occurs when no party member remains alive. There is no round limit. Restart seed recreates the same opening deal and enemy decisions; New deal increments the seed. The seed is visible and editable.

## Capturing feedback

**Export session** downloads JSON containing the rules version, seed, initial hands, all decisions and round refills, payment sizes offered at each action, cards paid/exchanged, chosen targets, effect amounts, and final game state. It is a research record, not an importable save. The full deck order is included, so inspect exports after playing if you want an unspoiled run.

Useful questions:

1. Was the cheapest or most expensive valid payment usually obvious?
2. Did keeping particular cards meaningfully affect later choices?
3. Did Basic, Guard, and Exchange offer useful alternatives?
4. Did character-specific private hands create identity or frustrating inactivity?
5. Did Control and healing justify their card payments versus damage?
6. Could you understand enemy intentions and range without guessing?

## Validation

`npm test` covers deck conservation, reproducible deals, movement and sight, distinct physical payments, effect tiers, turn limits, shield/heal/control, refill and reshuffling, and win/loss outcomes, alongside existing probability and research tests. `npm run build` includes TypeScript validation.

`node scripts/playtest-sanity.mjs` runs ten seeded encounters using a simple greedy policy, checking conservation of all 52 cards and absence of unit collisions after every action. At implementation time this policy produced nine wins in 4–6 rounds and one loss in round 8. This is a smoke check, not a claim about human difficulty or optimal play.

`scripts/playtest-browser-check.js` is an async function for the Chrome CLI's eval API. With the local app open at `#playtest` and its default seed, it checks movement, payments, effects, enemy phase, refill, JSON export, early-end confirmation, explorer access, and preservation of the encounter between tabs.
