# Tactical playtest

Open the app at `#playtest` (the default view). The probability explorer remains at `#analysis`; switching workspace tabs preserves the encounter and explorer configuration. Reloading starts a fresh game.

## Goal and controls

Defeat all enemies before all three party members are defeated. The default encounter has eight enemies. Select a character from the party strip or board. Click **Move** and a highlighted tile for optional movement, then use abilities while you can pay their costs, then choose End turn. For a card ability, select physical cards manually or expand the optional payment shortcuts, select an eligible target, and confirm. **Resolve enemy phase** advances the round after everyone acts; **End round early** explicitly confirms skipped activations.

The board is 10×10. Movement and range use orthogonal distance. Twelve walls are spread across A5, C3, C8, D6, E2, E9, F5, G1, G4, G7, I2, and I9. Cover is directional and destructible. A wall protects its adjacent unit against the front 90-degree sector (including diagonal boundaries). The strongest qualifying wall applies without stacking. Current 2-HP cover subtracts 35 percentage points; current 1-HP cover subtracts 20. Attacks from an uncovered flank or rear against a unit beside cover gain 15 percentage points, capped at 100%. This applies to Basic, abilities, enemy attacks and area damage; AoE attack direction is measured from the shooter. A protected miss deals 1 damage to the protecting wall. Hits and flank misses do not damage cover. Destroyed walls stop blocking movement and sight. Cover begins with a deterministic mix of 1 and 2 HP, displayed on the board. Units peek around walls adjacent to either shooter or target; cover adjusts hit chance instead of preventing the shot. Other walls between units in a shared row or column still block sight. Units block movement but not sight. Defeated units leave the board and cannot be healed.

## Party abilities

Each character has three unique abilities, at character-specific totals: A 15 / 21 / 24, B 13 / 22 / 31, C 14 / 22 / 25. Choose an ability, then manually select cards from that character's hand. **Payment shortcuts (optional)** starts collapsed and contains both automatic selection buttons and the complete list of valid combinations. It collapses again when changing character or ability. All powers are provisional playtest values.

| Character | Ability | Total | Range | 2 cards | 3 cards | 4 cards | 5 cards | 6 cards (crit) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: Single target, 12 HP | Impact | 15 | 4 | 5 damage | 6 damage | 9 damage | 12 damage | 24 damage |
| A | Piercing Strike | 21 | 5 | Impossible | 8 damage | 11 damage | 14 damage | 28 damage |
| A | Finisher | 24 | 3 | Impossible | 9 damage | 12 damage | 17 damage | 34 damage |
| B: Area damage, 10 HP | Burst | 13 | 4 | 2 damage | 3 damage | 4 damage | 5 damage | 10 damage |
| B | Shockwave | 22 | 4 | Impossible | 3 damage | 4 damage | 6 damage | 12 damage |
| B | Firestorm | 31 | 5 | Impossible | Impossible | 6 damage | 8 damage | 16 damage |
| C: Ranged debuffs, 10 HP | Disrupting Shot | 14 | 6 | 4 damage | 5 damage | 6 damage | 9 damage | 18 damage |
| C | Hamstring Shot | 22 | 6 | Impossible | 5 damage | 8 damage | 10 damage | 20 damage |
| C | Pinning Shot | 25 | 6 | Impossible | 8 damage | 10 damage | 13 damage | 26 damage |

Ability accuracy is 70% / 80% / 90% / 100% for 2 / 3 / 4 / 5 cards; six cards also have 100% base accuracy. Each affected enemy gets an independent seeded roll. Misses still spend cards and one ability use; mobile movement still resolves. Basic and enemy attacks start at 100% accuracy; cover and accuracy debuffs reduce that chance. The minimum hit chance is 5%. Suited payments and runs of at least three ranks immediately draw cards equal to the payment size, even on a miss. The UI previews hit chance, and exports record chances, rolls, and hit/miss results.

All nine abilities deal damage to enemies. Piercing Strike ignores shields (it does not remove them or ignore walls).

**Area damage:** target any non-wall ground tile in range and line of sight, including empty tiles or tiles occupied by allies. Burst hits enemies within one orthogonal tile of that center; Shockwave and Firestorm have radius two. Listed damage applies to each eligible enemy once. Area damage never hurts allies. A wall between the center and a victim in the same row/column protects that victim. Select the center to preview affected enemies before confirming.

**Ranged debuffs:** C moves three tiles normally and all three abilities have range six, with no dash. Disrupting Shot applies -30 percentage points accuracy on hit. Hamstring Shot applies -1 movement (minimum zero) on hit. Pinning Shot applies both. Damage is listed above. Both debuffs last through the next enemy phase and then expire, even if the enemy cannot attack. Repeated applications refresh rather than stack. A missed shot applies neither damage nor debuffs; a shielded hit still applies debuffs to surviving enemies. Cover and reduced accuracy subtract additively. Enemy intentions show the reduced movement and hit chance.


## Dev tools

Expand **Dev tools** to choose an enemy count from 1 to 10 with the number field or minus/plus buttons. **Restart with enemy count** starts a fresh encounter using the displayed seed and chosen count, resetting current progress. Eight is the initial default. Restart seed, New deal, and replay buttons retain the applied enemy count. Enemy positions are deterministic, never overlap walls or units, and use the same opening card deal for the same seed regardless of enemy count. Exports record the applied count and wall layout.

A numeric-total ability paid entirely with one suit or a run of at least three consecutive ranks draws cards equal to the number spent. Ace is low; J/Q/K retain rank identity for runs. No wraparound. Suited runs draw only once; Basic and Exert do not qualify. Six-card payments crit for double the five-card tier damage, before shields, for each enemy hit. They still require the exact numeric total and use 100% base accuracy before cover and debuffs. Suited/run redraws still apply.

## Round economy

- One standard 52-card deck supplies three **private** six-card hands. A=1; 2–9 face value; 10/J/Q/K=10.
- Each character may move once (all characters: up to three steps), **before** the first action. Each character may play card abilities without a per-round limit as long as the cost can be paid, including repeats. Movement costs no cards. Characters may be selected in any order, including interleaving their moves.
- Card abilities spend 2–6 distinct cards from the acting character's hand whose values sum exactly to the selected ability's total.
- **Basic:** 2 damage, range 5, costs any two distinct cards. Allows further abilities.
- **Exert:** after normal movement has been used, discard two cards of the same rank to move up to 2 additional steps. Repeatable while pairs remain, including after attacking. Walls and occupied tiles block movement.
- **End turn:** finish voluntarily without spending cards or gaining shield.
- **Exchange (free):** once per character per turn, discard any 1-6 selected cards and draw replacements immediately. Exchange before taking the first action, either before or after movement. It keeps the same character selected and does not spend movement or the action. You may exchange all six cards. Each character gets a new exchange at the start of the next round.
- After the party, enemies resolve in numeric ID order (E1, E2, and so on). Their current intentions are shown, but later enemies re-plan after earlier movement and defeats.
- Then living characters retain unused cards and refill to six. Refill priority rotates each round. Spent, exchanged, and defeated characters' held cards share one discard pile; it is shuffled into the draw pile only when that pile empties.
- An exchanged card can be drawn again if the draw pile empties and its discard is reshuffled during that exchange.

**Important experimental assumption:** full round-end refill makes high-card payments a tradeoff in retained card composition and future options, not a persistent hand-size penalty. Spending fewer cards can preserve more abilities in the same turn; qualifying patterns can replenish payments. Private hands also prevent one character's payment from directly consuming another's current hand. If taking the largest available payment becomes automatic, test a limited draw per round or a shared-hand variant next. Neither alternative is implemented in this baseline.

## Enemies and ending

Enemies default to 10 HP (configurable). The default group has six rifle enemies (range 5, movement 2, damage 2) and two shotgun enemies, E1 and E2 (range 3, movement 3, damage 4). Smaller/larger encounters use up to two shotguns and fill remaining slots with rifles. Rifle range approximates the player abilities' average range of 4.78. Rifle enemies prefer minimal movement before firing. Shotgun enemies push toward the closest firing position within its movement budget. All obey current cover, sight, movement penalties and accuracy. Later enemies re-plan after earlier attacks destroy cover.

Victory occurs immediately when the last enemy falls. Defeat occurs when no party member remains alive. There is no round limit. Restart seed recreates the same opening deal and enemy decisions; New deal increments the seed. The seed is visible and editable.

## Capturing feedback

**Export session** downloads JSON containing the rules version, seed, initial hands, all decisions and round refills, selected ability and payment sizes offered for all three abilities at each action, cards paid/exchanged, chosen targets, per-enemy damage, ground target positions, enemy count, and final game state. It is a research record, not an importable save. The full deck order is included, so inspect exports after playing if you want an unspoiled run.

Useful questions:

1. Was the cheapest or most expensive valid payment usually obvious?
2. Did keeping particular cards meaningfully affect later choices?
3. Did the free exchange improve choices, and did Basic and Exert remain useful?
4. Did character-specific private hands create identity or frustrating inactivity?
5. Did area damage and debuffs create useful alternatives to strong single-target hits?
6. Could you understand enemy intentions and range without guessing?

## Validation

`npm test` covers deck conservation, reproducible deals, movement and sight, distinct physical payments, effect tiers, all nine offensive abilities, area damage, ranged debuffs and cover, the C6/D6 wall example, enemy counts 1-10, once-per-turn free exchanges, unlimited abilities, payment redraws, Exert, refill and reshuffling, and win/loss outcomes, alongside existing probability and research tests. `npm run build` includes TypeScript validation.

`node scripts/playtest-sanity.mjs` runs ten seeded encounters using a simple greedy policy, checking conservation of all 52 cards and absence of unit collisions after every action. The policy considers all three abilities, area victims, and ground target positions and exchanges a hand with no valid payments before choosing an action. This is a smoke check, not a claim about human difficulty or optimal play.

`scripts/playtest-browser-check.js` is an async function for the Chrome CLI's eval API. With the local app open at `#playtest` and its default seed, it checks movement, payments, effects, enemy phase, refill, JSON export, early-end confirmation, explorer access, and preservation of the encounter between tabs.

## Undo and enemy health

**Undo last action** restores the previous game state, including cover health/destruction, cards, random rolls, health, movement, ability uses, exchange use and the event log. Repeated clicks step backward through actions. An enemy phase and its refill undo together. Undo works after victory or defeat; restarts clear history. Repeating the same undone action gives the same random result.

Dev tools includes **Enemy max health** (1-999, default 10). Either restart control applies both enemy count and health, resetting the encounter. All enemies start at the chosen maximum. Normal restarts and new deals retain this setting; exports record it.
