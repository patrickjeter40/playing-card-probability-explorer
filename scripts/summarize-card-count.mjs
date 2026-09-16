import {readFileSync,writeFileSync} from 'node:fs';
const root='reports';
const readCsv=path=>{const [keys,...rows]=readFileSync(`${root}/${path}`,'utf8').trim().split(/\r?\n/).map(r=>r.split(','));return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])));};
const tiers=readCsv('card-count/all-hands-tiers.csv'),capacity=readCsv('card-count/party-capacity-by-tier.csv');
const get=(h,t)=>tiers.find(r=>+r.hand_size===h&&+r.total===t),pct=v=>`${(Number(v)*100).toFixed(2)}%`;
const table=(head,rows)=>`| ${head.join(' | ')} |\n| ${head.map(()=> '---').join(' | ')} |\n${rows.map(row=>`| ${row.join(' | ')} |`).join('\n')}\n`;
const rowTable=h=>table(['Total','2-card option','3-card option','4-card option','5-card option','Any option','5-card option given success'],[12,15,20,21,24,27,30,31,39,41,44,47].map(t=>{const r=get(h,t);return[t,...[2,3,4,5].map(k=>pct(r[`can_play_${k}_cards_probability`])),pct(r.ability_probability),pct(r.five_card_option_given_ability)];}));
const handTable=table(['Hand','Total 15: five cards','Total 21: five cards','Total 24: five cards','Total 31: five cards'],Array.from({length:9},(_,i)=>i+4).map(h=>[h,...[15,21,24,31].map(t=>pct(get(h,t).can_play_5_cards_probability))]));
const bestTable=table(['Hand','Total','No activation','Best tier 2','Best tier 3','Best tier 4','Best tier 5'],[6,8,10].flatMap(h=>[15,21,24,31].map(t=>{const r=get(h,t);return[h,t,...[0,2,3,4,5].map(k=>pct(r[`highest_available_tier_${k}_probability`]))];})));
const capacityTable=table(['Shared H','Allowed payment sizes','Mean maximum activations','At least 2 activations','At least 3 activations'],capacity.filter(r=>[8,10,12].includes(+r.hand_size)&&['2;3;4;5','3','4','5'].includes(r.allowed_sizes)).map(r=>[r.hand_size,r.allowed_sizes,Number(r.mean_maximum_activations).toFixed(2),pct(r.probability_at_least_2_activations),pct(r.probability_at_least_3_activations)]));
const md=`# Power from cards spent: a third rule model

## Revised recommendation

**Test card-count tiers as the primary power model first.** Keep the numeric total as the ability identity, then let the player buy a stronger effect by spending a larger valid subset. For example, 2 cards = basic, 3 = improved, 4 = powerful, 5 = empowered/critical. These are ordinal labels, not proposed damage multipliers. Compare rank-based pattern criticals in a separate variant before stacking both bonuses.

This is a stronger fit for deliberate party-resource decisions than assuming every stronger effect must be a rarer total. The trigger is visible and the cost is immediate. It can create a decision between one empowered activation and several ordinary activations. Whether that tradeoff is compelling depends on the actual effects, action limits, and refill rules; this study does not assign damage values.

**More cards always cost more resources. More cards do not always mean a rarer opportunity.** At H=8, total 30 is available with 3 cards in ${pct(get(8,30).can_play_3_cards_probability)} of hands and with 5 cards in ${pct(get(8,30).can_play_5_cards_probability)}. Total 15's 3-card version is also more common than its 2-card version. Increasing cardinality is not a universal difficulty curve.

## Exact availability at six cards per character

${rowTable(6)}

For a six-card private hand, **21 is a good three-level ability candidate**: three-card payment is offered in ${pct(get(6,21).can_play_3_cards_probability)} of opening hands, four-card in ${pct(get(6,21).can_play_4_cards_probability)}, and five-card in ${pct(get(6,21).can_play_5_cards_probability)}. The ability itself is usable in ${pct(get(6,21).ability_probability)}. Two-card payment is impossible, so do not display a nonexistent two-card version in its UI.

For an ability with all four payment sizes, **15** is usable in ${pct(get(6,15).ability_probability)}, but its five-card version is only ${pct(get(6,15).can_play_5_cards_probability)}: exceptionally rare in an opening hand. Use **24** if a more frequent empowered option is desired (${pct(get(6,24).can_play_5_cards_probability)} at H=6), knowing its cheapest payment is three cards. For H=6, the five-card payment also consumes five-sixths of that character's hand before any refill.

These probabilities overlap: one hand can offer several payment sizes. They are not mutually exclusive tiers. The next section classifies the strongest option each hand actually offers.

## Highest available tier, jointly calculated

The generator enumerates the complete hand, checks every allowed cardinality, and records its maximum. Each row below is a distribution summing to 100% (subject to rounding). It is **not** obtained by subtracting overlapping marginal probabilities. The player may still choose a cheaper available option; strongest offered is not strongest chosen.

${bestTable}

The saved CSV also includes the mean minimum and maximum available card counts conditional on success, plus the joint probability of a two-card and five-card option. These distinguish an actual optional upgrade from a hand that can only activate by paying five cards.

## Eight-card shared hand: richer upgrades, tighter party budget

${rowTable(8)}

At H=8, five-card 21 is offered in ${pct(get(8,21).can_play_5_cards_probability)} of all hands and ${pct(get(8,21).five_card_option_given_ability)} of successful hands. This is a much more frequent upgrade than with six cards. A five-card activation leaves only three cards for the rest of the party. At most one more minimum-two-card activation can follow from those remaining cards, and it may not make any useful target.

## Increasing hand size changes what "critical" means

${handTable}

At H=10, five-card 21 is available in ${pct(get(10,21).can_play_5_cards_probability)} of opening hands. At H=12 it reaches ${pct(get(12,21).can_play_5_cards_probability)}. Calling this a rare critical would be misleading; it is a frequently offered paid upgrade. Choose "empowered" or "overcharged" if that better communicates the intended role.

## Card spending reduces how many characters can act

The following study uses menu {15,21,31}, one shared opening hand, and identical access for all actors. Each sampled hand is optimally packed without reusing cards. Each fixed-size row permits **only that payment tier** for every activation; it is a capacity comparison, not a prediction of player behavior or an optimal damage policy. Samples: 5,000 per H with common shuffled hands across tier restrictions. Only total 15 is reachable in the two-card-only menu; compare that row with caution in the full CSV.

${capacityTable}

At H=10, allowing all payment sizes supports about 2.73 activations on average in this menu; demanding five cards for every activation supports about 1.00. Two five-card activations are feasible in only about 6.14% of sampled hands. Five-card effects therefore impose a real party opportunity cost even when a single five-card target is common.

A ten-card shared hand can never fund three five-card activations without drawing more cards. A twelve-card hand can never fund three either. A party of five cannot all play five cards from a hand of twelve; high Decision Density does not change this card-count bound.

## Structural consequences for ability design

- **Totals 2–20:** can have a two-card base option, though the very smallest totals cannot reach all higher tiers. Total 5 cannot be made with five cards in this deck: five aces do not exist. A five-card total is at least 6.
- **Totals 21–30:** inherently require at least three cards. They can have three-, four-, and five-card versions.
- **Totals 31–40:** require at least four cards. Only four- and five-card versions exist.
- **Totals 41–50:** require exactly five cards. If "five cards means critical," every successful activation is critical; there is no lower-tier version. Treat these as fixed-cost ultimates rather than optional upgrades.
- **31 changes role between models:** impossible to pattern-crit under either run/match definition, yet its five-card version is offered in ${pct(get(8,31).can_play_5_cards_probability)} of eight-card hands. A count-based critical at 31 would be common, not a subtle replacement for the pattern rule.
- A universal "2 weakest / 5 strongest" rule does not create the same upgrade range for every total. Use ability-specific tier labels if the base payment starts at three or four cards.
- Do not price a 41 ability as though both its high total and its automatic five-card tier were independent rarity gates. They describe the same requirement.

## Compare the three power models

${table(['Model','What gates power','What it encourages','Main pitfall'],[
['Rarer total','Opening-hand reachability','Finding a signature total','Large hands flatten rarity; availability changes after spending'],
['Run/match critical','Particular structure within a successful subset','Saving and arranging patterns','Some totals never crit; ten-valued cards distort value matching'],
['More-card effect','A larger legal payment for the same total','Buying impact with card budget','Five-card options can be common; some totals force five cards'],
])}

**Suggested first comparison:** retain a six-card private-hand prototype and an eight- or ten-card shared-hand prototype. Give a 15 ability multiple sizes, a 21 ability three sizes, and a 24 ability a more accessible five-card upgrade. Keep fixed high-total ultimates separate from optional upgrades. Allow card-free fallback actions. Playtest whether players voluntarily pay four or five cards when cheaper options and other characters' actions are available.

Avoid initially multiplying all three reward axes together. Use card-count tiers for power, and optionally let a rank run/match add a modest distinct rider (for example repositioning or a debuff) rather than another large multiplier; this is a proposed design experiment, not a measured balance result. The right effect scaling cannot be inferred from probability alone.

## Files and limits

- [All exact card-count tiers](card-count/all-hands-tiers.csv), with separate per-H reports in the same folder.
- [Party capacity by payment tier](card-count/party-capacity-by-tier.csv).
- [Original critical, total-rarity, and party-hand evaluation](evaluation.md).

All availability and joint tier distributions are exact. Capacity is a 5,000-hand simulation per H, with exact optimization inside each hand; worst-case per-probability 95% margin is about ±1.39 percentage points. Mean activation counts do not have that probability margin. The model has no refill, draw, discard, retention, class-specific loadout restrictions, targets, cooldowns, or damage scaling. Identical menu access is generous relative to narrower per-character menus. A different menu can change the capacities substantially.
`;
writeFileSync(`${root}/card-count-evaluation.md`,md);
let evaluation=readFileSync(`${root}/evaluation.md`,'utf8');
evaluation=evaluation.replace('Use rank-based criticals.','Test card-count tiers as the primary power model; compare rank-based pattern criticals as an alternative.');
evaluation=evaluation.replace('## Scope and evidence',`## Added rule: more cards, more power\n\n[Read the card-count evaluation](card-count-evaluation.md) for the revised priority. At H=8, five-card 21 is available in ${pct(get(8,21).can_play_5_cards_probability)} of hands; at H=10, ${pct(get(10,21).can_play_5_cards_probability)}. This creates a paid upgrade, not necessarily a rare event. Total 31 can frequently upgrade through five cards even though it can never pattern-crit. Totals 41–50 always require five cards, so a universal five-card critical would apply to every successful activation.\n\nThe recommendations below for high totals concern the **rarity-based** variant. For the **card-count** variant, start with totals 15, 21, and 24 to compare different upgrade profiles. Keep these two design approaches distinct when pricing abilities.\n\n## Scope and evidence`);
writeFileSync(`${root}/evaluation.md`,evaluation);
let index=readFileSync(`${root}/README.md`,'utf8');index=index.replace('Start with [Evaluation','Start with [Card-count power evaluation](card-count-evaluation.md), [Evaluation');index=index.replace('## Supporting studies','## Supporting studies\n\n- [Card-count tiers](card-count/all-hands-tiers.csv): **exact**, 441 rows. Joint highest/lowest offered card-count tiers plus all cardinality marginals. Nine per-hand CSVs are in the same folder.\n- [Party capacity by tier](card-count/party-capacity-by-tier.csv): spent-card constraints when only a particular effect tier may be used; 5,000 matched samples per H.');writeFileSync(`${root}/README.md`,index);
let html=readFileSync(`${root}/review.html`,'utf8');
html=html.replace('routine 15/21, stronger 31, signatures 37/39.','test tiered abilities at totals 15, 21 and 24. See the full evaluation for rarity-based alternatives.');
html=html.replace('<strong>10–12 cards</strong><p>One party hand. Spending competes across characters; do not promise every character a card-funded action.</p>','<strong>8–10 cards</strong><p>For the card-count model, compare upgrade frequency with remaining party actions. The rarity-only model also considers H=12.</p>');
html=html.replace('<nav>','<nav><a href="card-count-evaluation.md">Card-count power study</a>');
html=html.replace('<div class="eyebrow">CRITICAL RULE</div><strong>Use ranks</strong><p>Face cards retain identity. 31 and 41 cannot crit under either tested definition; make that deliberate.</p>','<div class="eyebrow">POWER MODEL TO TEST FIRST</div><strong>More cards → more power</strong><p>Pay for stronger effects with a larger subset. Compare rank-based patterns separately. Extra cards cost more but are not always rarer.</p>');
const section=`<section><h2>Power from cards spent</h2><p><span class="pill">Exact</span> At H=8, five-card 21 occurs in ${pct(get(8,21).can_play_5_cards_probability)} of hands; at H=10 it is ${pct(get(10,21).can_play_5_cards_probability)}. These are paid upgrades. Any total above 40 forces five cards, so it cannot offer a cheaper version.</p><label>Starting hand <select id="tier-hand">${Array.from({length:9},(_,i)=>i+4).map(h=>`<option value="${h}" ${h===6?'selected':''}>${h} cards</option>`).join('')}</select></label><div class="table"><table id="tiers"></table></div><p>Card-count columns overlap; a hand can offer more than one size. The final column is the five-card option conditional on any activation being possible. <a href="card-count-evaluation.md">Joint highest-tier distributions and party spending analysis</a>.</p></section>`;
html=html.replace('<section><h2>Critical opportunities</h2>',section+'<section><h2>Critical opportunities</h2>');
html=html.replace('</body>',`<script>const tierData=${JSON.stringify(tiers)};function renderTiers(){const h=Number(document.querySelector('#tier-hand').value);document.querySelector('#tiers').innerHTML='<thead><tr><th>Total</th><th>2-card option</th><th>3-card option</th><th>4-card option</th><th>5-card option</th><th>Any activation</th><th>5-card given success</th></tr></thead><tbody>'+tierData.filter(r=>Number(r.hand_size)===h).map(r=>'<tr><th>'+r.total+'</th>'+[2,3,4,5].map(k=>'<td>'+pct(r['can_play_'+k+'_cards_probability'])+'</td>').join('')+'<td>'+pct(r.ability_probability)+'</td><td>'+(r.five_card_option_given_ability===''?'—':pct(r.five_card_option_given_ability))+'</td></tr>').join('')+'</tbody>';}document.querySelector('#tier-hand').addEventListener('change',renderTiers);renderTiers();</script></body>`);
writeFileSync(`${root}/review.html`,html);
console.log('Card-count power evaluation and interactive tier explorer added.');
