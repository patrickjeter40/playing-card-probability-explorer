Build a small interactive web app called **Playing Card Probability Explorer** for game-design research.

The purpose of the tool is to analyze a standard playing-card deck numerically and show which totals are statistically easy or difficult to create from different hand sizes and different numbers of played cards.

## Core deck rules

Use a standard 52-card deck.

Card values:

- Ace = 1
- 2–9 = face value
- 10 = 10
- Jack = 10
- Queen = 10
- King = 10

Therefore the numeric deck distribution is:

- four 1s
- four 2s
- four 3s
- four 4s
- four 5s
- four 6s
- four 7s
- four 8s
- four 9s
- sixteen 10s

Suits do not matter for the initial version, but structure the code so suit-aware analysis could be added later.

## Main user controls

Allow the user to configure:

1. **Starting hand size**
   - Range: 4–12 cards
   - Default: 8

2. **Cards played**
   - Checkboxes/toggles for:
     - exactly 2 cards
     - exactly 3 cards
     - exactly 4 cards
     - exactly 5 cards
   - Allow multiple play sizes to be shown simultaneously.
   - Default: 2, 3, and 4 enabled.

3. **Analysis mode**
   Provide at least these two modes:

   **Probability of being able to make total**
   - For every possible numeric total, calculate the probability that a randomly dealt starting hand contains at least one subset of exactly N cards that sums to that total.

   **Average number of ways to make total**
   - For every possible total, calculate the expected number of distinct N-card subsets in the starting hand that sum to that total.

4. Optional input for **highlighted target totals**
   - Default targets: 15, 21, 31
   - Allow user to add/remove targets.
   - Visually mark them on charts.

## Required charts

Create a primary line chart.

X-axis:
- Numeric total

Y-axis:
- Probability from 0–100%, or average number of combinations depending on selected analysis mode.

Each selected play size should be its own series:

- 2-card plays
- 3-card plays
- 4-card plays
- 5-card plays

The chart should update immediately when configuration changes.

Below the chart, provide a table with one row per possible total.

Columns:

- Total
- Probability with 2 cards
- Probability with 3 cards
- Probability with 4 cards
- Probability with 5 cards
- Average ways with 2 cards
- Average ways with 3 cards
- Average ways with 4 cards
- Average ways with 5 cards

Hide columns for play sizes that are not currently selected if that improves readability.

Make the table sortable.

## Important game-design metrics

Add a second section called **Target Analysis**.

For every highlighted target such as 15, 21, or 31, show:

- Probability the starting hand can make that total with exactly 2 cards
- exactly 3 cards
- exactly 4 cards
- exactly 5 cards
- probability it can make the target using ANY currently selected play size
- average number of distinct ways the hand can make that target
- probability there are at least 2 distinct ways to make the target
- probability there are at least 3 distinct ways to make the target

This is important because I am evaluating these totals for a turn-based tactics game.

I care not only about whether a player can hit a target, but about **decision density**: how often the player has several different card combinations that achieve the same target.

Add a metric called:

**Decision Density**

Define it initially as:

> Average number of valid distinct subsets that hit the target, conditional on the hand being able to hit the target at least once.

For example, if successful hands capable of making 21 have an average of 3.7 different combinations that make 21, Decision Density = 3.7.

Show this prominently for highlighted targets.

## Comparison mode

Add a useful comparison view where I can select a play size, such as exactly 3 cards, and rank totals by:

- highest probability of being achievable
- highest Decision Density
- lowest probability
- probability closest to 50%
- probability closest to 75%

This should help identify good game-design target numbers.

Example insight I want the tool to make easy to discover:

> "With an 8-card hand and exactly 3 cards played, total 21 can be formed in 72% of hands and successful hands contain an average of 2.8 ways to make it."

Do not hardcode conclusions like that; calculate them.

## Calculation requirements

Accuracy matters more than raw speed.

Prefer **exact combinatorial calculation** where computationally practical.

If exact enumeration becomes too expensive for larger hand sizes, support a Monte Carlo simulation mode.

Provide a toggle:

- Exact
- Monte Carlo

For Monte Carlo:

- configurable sample count
- defaults:
  - 100,000 samples
- provide options for:
  - 10,000
  - 100,000
  - 1,000,000

Show a small indicator stating whether displayed results are exact or simulated.

Use an efficient representation for hands and subsets.

Do not count identical selections multiple times merely because cards of the same numeric value are physically interchangeable unless those represent genuinely different subsets of cards in the dealt hand.

Be very careful about the distinction between:

1. probability that at least one valid subset exists
2. number of subsets that satisfy the target
3. conditional number of subsets given that the target is achievable

Write tests for these.

## Validation cases

Include automated tests covering cases small enough to verify manually.

Examples:

- A two-card hand [5, 10] has exactly one 2-card subset totaling 15.
- [5, 5, 10] has multiple distinct physical-card subsets involving the two different 5s.
- Verify that 10/J/Q/K all have numeric value 10.
- Verify that no subset uses a card more than once.
- Verify probabilities stay between 0 and 1.
- Verify probabilities across totals do NOT need to sum to 1, because one hand may be capable of producing multiple totals.

## UI / UX

Make this a clean, compact game-design analysis tool rather than a generic admin dashboard.

Recommended layout:

Top:
- controls

Middle:
- main probability/distribution chart

Below:
- Target Analysis cards for 15, 21, 31

Below that:
- ranked totals / comparison view

Bottom:
- detailed sortable table

Desktop-first but responsive.

Use sensible tooltips explaining:

- Achievability Probability
- Average Ways
- Decision Density

## Tech stack

Use the existing project's stack if one exists.

If starting from scratch, use:

- React
- TypeScript
- Vite
- Recharts for visualization

Keep probability/combinatorics logic separated from presentation code.

Suggested structure:

- `src/math/deck.ts`
- `src/math/combinations.ts`
- `src/math/analyze.ts`
- `src/math/simulation.ts`
- `src/components/Controls.tsx`
- `src/components/ProbabilityChart.tsx`
- `src/components/TargetAnalysis.tsx`
- `src/components/RankingTable.tsx`

The mathematical analysis functions should be pure and independently testable.

## Future-proofing

Do NOT implement all of these now, but design the data model so later we can add:

- suit requirements
- pairs / triples / four-of-a-kind
- straights
- flushes
- poker hands
- bonuses for exact totals
- custom decks
- different card values
- character-specific decks
- cards removed because of character damage
- draw/discard mechanics

The immediate version should stay focused on **numeric subset-sum analysis**.

## Deliverable

Implement the complete working app.

After implementation:

1. Run tests.
2. Run TypeScript/type checks.
3. Fix any errors.
4. Start the app and verify the main interactions work.
5. Briefly document the calculation methodology and any performance tradeoffs in the README.

Prioritize mathematical correctness and useful visualization over visual polish.