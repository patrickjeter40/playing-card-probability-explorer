# Tactical playtest

Open the app at `#playtest` (the default view). The probability explorer remains at `#analysis`; switching workspace tabs preserves the encounter and explorer configuration. Reloading starts a fresh game.

## Goal and controls

Defeat all enemies before all three party members are defeated. The default encounter has five enemies. Select a character from the party strip or board. Click **Move** and a highlighted tile for optional movement, then choose one action. For a card ability, select physical cards manually or expand the optional payment shortcuts, select an eligible target, and confirm. **Resolve enemy phase** advances the round after everyone acts; **End round early** explicitly confirms skipped activations.

The board is 7×7. Movement and range use orthogonal distance. Walls are spread across C3, E2, D6, and F5. They block movement and attacks along a shared row or column when the wall is between attacker and target. Attacks into other rows and columns are allowed: from C6, a wall at D6 blocks E6/F6/G6 but allows in-range targets in rows 5 and 7. Targets on the attacker’s side of the wall remain eligible. The rule applies symmetrically to enemies and to area effects measured from their center; it is not geometric ray tracing. Units block movement but not sight. Defeated units leave the board and cannot be healed.

## Party abilities

Each character has three unique abilities, one at each total (15, 21, and 24). Choose an ability, then manually select cards from that character's hand. **Payment shortcuts (optional)** starts collapsed and contains both automatic selection buttons and the complete list of valid combinations. It collapses again when changing character or ability. All powers are provisional playtest values.

| Character | Ability | Total | Range | 2 cards | 3 cards | 4 cards | 5 cards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A: Single target, 12 HP | Impact | 15 | 3 | 3 damage | 4 damage | 6 damage | 8 damage |
| A | Piercing Strike | 21 | 4 | Impossible | 5 damage | 7 damage | 9 damage |
| A | Finisher | 24 | 2 | Impossible | 6 damage | 8 damage | 11 damage |
| B: Area damage, 10 HP | Burst | 15 | 3 | 2 damage | 3 damage | 4 damage | 5 damage |
| B | Shockwave | 21 | 3 | Impossible | 3 damage | 4 damage | 6 damage |
| B | Firestorm | 24 | 4 | Impossible | 4 damage | 6 damage | 8 damage |
| C: Mobile damage, 10 HP | Lunge | 15 | 1 | 3 damage | 4 damage | 5 damage | 7 damage |
| C | Drive-by | 21 | 2 | Impossible | 4 damage | 6 damage | 8 damage |
| C | Blitz | 24 | 1 | Impossible | 6 damage | 8 damage | 10 damage |

All nine abilities deal damage to enemies. Piercing Strike ignores shields (it does not remove them or ignore walls).

**Area damage:** target a living enemy in range. Burst hits enemies within one orthogonal tile of that center; Shockwave and Firestorm have radius two. Listed damage applies to each eligible enemy once. Area damage never hurts allies. A wall between the center and a victim in the same row/column protects that victim. Select the center to preview affected enemies before confirming.

**Mobile damage:** C has five tiles of normal movement. In addition, Lunge allows up to two extra movement steps, Drive-by three, and Blitz four, immediately before the hit. With a valid payment, choose a purple attack-position tile, then an enemy in range from there. You can also stay on your current tile. Confirming moves C and deals damage together; previewing does not spend anything. These paths cannot pass through walls or occupied tiles. This movement can follow normal movement and still costs only the one ability action.

## Dev tools

Expand **Dev tools** to choose an enemy count from 1 to 10 with the number field or minus/plus buttons. **Restart with enemy count** starts a fresh encounter using the displayed seed and chosen count, resetting current progress. Five is the initial default. Restart seed, New deal, and replay buttons retain the applied enemy count. Enemy positions are deterministic, never overlap walls or units, and use the same opening card deal for the same seed regardless of enemy count. Exports record the applied count and wall layout.

There are no suit, run, matching-rank, or random critical bonuses. Five-card power is an explicit paid upgrade, with no extra multiplier beyond the listed effect.

## Round economy

- One standard 52-card deck supplies three **private** six-card hands. A=1; 2–9 face value; 10/J/Q/K=10.
- Each character may move once (A/B: up to three steps; C: up to five), **before** taking one action. Movement costs no cards. Characters may be selected in any order, including interleaving their moves.
- Card abilities spend 2–5 distinct cards from the acting character's hand whose values sum exactly to the selected ability's total.
- **Basic:** 2 damage, range 2, no cards, spends the action.
- **Guard:** gain 3 shield, keep all cards, spends the action.
- **Exchange (free):** once per character per turn, discard any 1-6 selected cards and draw replacements immediately. Exchange before taking the action, either before or after movement. It keeps the same character selected and does not spend movement or the action. You may exchange all six cards. Each character gets a new exchange at the start of the next round.
- After the party, enemies resolve in numeric ID order (E1, E2, and so on). Their current intentions are shown, but later enemies re-plan after earlier movement and defeats.
- Then living characters retain unused cards and refill to six. Refill priority rotates each round. Spent, exchanged, and defeated characters' held cards share one discard pile; it is shuffled into the draw pile only when that pile empties.
- An exchanged card can be drawn again if the draw pile empties and its discard is reshuffled during that exchange.

**Important experimental assumption:** full round-end refill makes high-card payments a tradeoff in retained card composition and future options, not a persistent hand-size penalty. Private hands also prevent one character's payment from directly consuming another's current hand. If taking the largest available payment becomes automatic, test a limited draw per round or a shared-hand variant next. Neither alternative is implemented in this baseline.

## Enemies and ending

Enemies each have 10 HP. Every third enemy (E3, E6, E9) is ranged: move one, attack for two at range three. Other enemies move two and attack for three at range one. Enemies prefer an attack reachable with the least movement, with deterministic proximity and ID tie-breaks. Otherwise they advance along a shortest legal path toward a firing position. They use the same wall-targeting rule as the party.

Victory occurs immediately when the last enemy falls. Defeat occurs when no party member remains alive. There is no round limit. Restart seed recreates the same opening deal and enemy decisions; New deal increments the seed. The seed is visible and editable.

## Capturing feedback

**Export session** downloads JSON containing the rules version, seed, initial hands, all decisions and round refills, selected ability and payment sizes offered for all three abilities at each action, cards paid/exchanged, chosen targets, per-enemy damage, mobile attack positions, enemy count, and final game state. It is a research record, not an importable save. The full deck order is included, so inspect exports after playing if you want an unspoiled run.

Useful questions:

1. Was the cheapest or most expensive valid payment usually obvious?
2. Did keeping particular cards meaningfully affect later choices?
3. Did the free exchange improve choices, and did Basic and Guard remain useful?
4. Did character-specific private hands create identity or frustrating inactivity?
5. Did area damage and extra movement create useful alternatives to strong single-target hits?
6. Could you understand enemy intentions and range without guessing?

## Validation

`npm test` covers deck conservation, reproducible deals, movement and sight, distinct physical payments, effect tiers, all nine offensive abilities, area damage, mobile attack paths, the C6/D6 wall example, enemy counts 1-10, once-per-turn free exchanges, turn limits, shields, refill and reshuffling, and win/loss outcomes, alongside existing probability and research tests. `npm run build` includes TypeScript validation.

`node scripts/playtest-sanity.mjs` runs ten seeded encounters using a simple greedy policy, checking conservation of all 52 cards and absence of unit collisions after every action. The policy considers all three abilities, area victims, and mobile attack positions and exchanges a hand with no valid payments before choosing an action. This is a smoke check, not a claim about human difficulty or optimal play.

`scripts/playtest-browser-check.js` is an async function for the Chrome CLI's eval API. With the local app open at `#playtest` and its default seed, it checks movement, payments, effects, enemy phase, refill, JSON export, early-end confirmation, explorer access, and preservation of the encounter between tabs.
