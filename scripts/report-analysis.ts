import { mkdirSync, writeFileSync } from 'node:fs';
import { analyzeExact } from '../src/math/analyze';
import { choose, subsetCounts } from '../src/math/combinations';
import { seededRandom } from '../src/math/simulation';
import { criticalCounts, handSubsets, hasTwoDisjoint, maximumPlays, wilson, exactValueCritical } from '../src/research/mechanics';

const root = 'reports';
const criticalSamples = 100000, partySamples = 10000, spendingSamples = 5000;
const baseSeed = 20260915;
for (const dir of ['exact','critical','party','spending']) mkdirSync(`${root}/${dir}`,{recursive:true});
function csv(file:string, rows:Record<string,unknown>[]) {
  const keys = Object.keys(rows[0]);
  const cell = (v:unknown) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s; };
  writeFileSync(`${root}/${file}`, [keys.map(cell).join(','),...rows.map(row=>keys.map(k=>cell(row[k])).join(','))].join('\r\n')+'\r\n');
}
const metrics = (m:any) => ({probability:m.probability,average_ways:m.averageWays,decision_density:m.probability?m.density:'',probability_at_least_2_ways:m.atLeast2,probability_at_least_3_ways:m.atLeast3});
const exact:any[] = [], combined:any[] = [];
for (let h=4;h<=12;h++) {
  const start=performance.now();
  const result = analyzeExact({handSize:h,selected:[2,3,4,5],method:'exact',samples:100000,seed:baseSeed});
  exact.push(result);
  for (const k of [2,3,4,5]) {
    const rows=result.rows.map(row=>({hand_size:h,cards_played:k,total:row.total,...metrics(row.sizes[k]),method:'exact'}));
    const mass = result.rows.reduce((n,row)=>n+row.sizes[k].averageWays,0);
    if (Math.abs(mass-choose(h,k))>1e-8) throw Error(`Expected subsets failed H=${h}, k=${k}`);
    csv(`exact/hand-${String(h).padStart(2,'0')}-play-${k}.csv`,rows);
  }
  const rows=result.rows.map(row=>({hand_size:h,cards_played:'any_2_to_5',total:row.total,...metrics(row.any),method:'exact'}));
  combined.push(...rows); csv(`exact/hand-${String(h).padStart(2,'0')}-any-2-to-5.csv`,rows);
  console.log(`Exact H=${h}: ${result.observations} vectors, ${((performance.now()-start)/1000).toFixed(2)}s`);
}
csv('exact/all-hands-any-2-to-5.csv',combined);
writeFileSync(`${root}/exact/results.json`,JSON.stringify(exact));
function deal(n:number, random:()=>number, cards:number[]) {
  for (let i=0;i<n;i++) { const j=i+Math.floor(random()*(52-i)); [cards[i],cards[j]]=[cards[j],cards[i]]; }
  return cards.slice(0,n);
}
const freshDeck = () => Array.from({length:52},(_,i)=>i%13+1);
const criticalRows:any[]=[];
for (let h=4;h<=12;h++) {
  const start=performance.now(), random=seededRandom(baseSeed+h), cards=freshDeck();
  const hit=Array.from({length:2},()=>Array.from({length:6},()=>Array.from({length:51},()=>({run:0,match:0,either:0,ways:0}))));
  const ability=Array.from({length:6},()=>new Uint32Array(51));
  for (let sample=0;sample<criticalSamples;sample++) {
    const ranks=deal(h,random,cards), ways=subsetCounts(ranks.map(r=>Math.min(r,10)));
    for (let t=2;t<=50;t++) {
      let any=0;
      for (let k=2;k<=5;k++) { if(ways[k][t]) ability[k][t]++; any+=ways[k][t]; }
      if(any) ability[0][t]++;
    }
    for (const [d,definition] of (['rank','value'] as const).entries()) {
      const counts=criticalCounts(ranks,definition);
      for(let t=2;t<=50;t++) {
        let run=0,match=0;
        for(let k=2;k<=5;k++) {
          const r=counts.runs[k][t],m=counts.matches[k][t],a=hit[d][k][t];
          a.run+=+(r>0);a.match+=+(m>0);a.either+=+(r+m>0);a.ways+=r+m;run+=r;match+=m;
        }
        const a=hit[d][0][t];a.run+=+(run>0);a.match+=+(match>0);a.either+=+(run+match>0);a.ways+=run+match;
      }
    }
  }
  for(const [d,definition] of ['rank','value'].entries()) for(const k of [2,3,4,5,0]) for(let t=2;t<=50;t++) {
    const a=hit[d][k][t], [lo,hi]=wilson(a.either,criticalSamples);
    const n=ability[k][t], ci=n?wilson(a.either,n):['',''];
    if(a.either>n) throw Error('Critical event must imply ability');
    const e=exact[h-4].rows[t-2];
    criticalRows.push({hand_size:h,cards_played:k||'any_2_to_5',total:t,definition,method:'monte_carlo',samples:criticalSamples,seed:baseSeed+h,
      exact_ability_probability:(k?e.sizes[k]:e.any).probability,ability_successes:n,critical_successes:a.either,
      run_probability:a.run/criticalSamples,match_probability:a.match/criticalSamples,critical_probability:a.either/criticalSamples,
      critical_probability_ci95_low:lo,critical_probability_ci95_high:hi,
      critical_available_given_ability:n?a.either/n:'',conditional_ci95_low:ci[0],conditional_ci95_high:ci[1],average_critical_ways:a.ways/criticalSamples});
  }
  console.log(`Critical H=${h}: ${criticalSamples} shared samples, ${((performance.now()-start)/1000).toFixed(2)}s`);
}
for(let h=4;h<=12;h++) {
  const valueExact=exactValueCritical(h);
  for(const row of criticalRows.filter(r=>r.hand_size===h && r.definition==='value')) {
    const k=row.cards_played==='any_2_to_5'?0:row.cards_played,a=valueExact[k][row.total];
    const tolerance=6*Math.sqrt(a.either*(1-a.either)/criticalSamples)+6/criticalSamples;
    if(Math.abs(row.critical_probability-a.either)>tolerance)throw Error('Numeric-critical Monte Carlo validation failed');
    row.method='exact';row.samples='';row.seed='';row.ability_successes='';row.critical_successes='';
    row.run_probability=a.run;row.match_probability=a.match;row.critical_probability=a.either;
    row.critical_probability_ci95_low='';row.critical_probability_ci95_high='';
    row.critical_available_given_ability=row.exact_ability_probability?a.either/row.exact_ability_probability:'';
    row.conditional_ci95_low='';row.conditional_ci95_high='';row.average_critical_ways=a.ways;
  }
  console.log(`Numeric-value critical exact validation H=${h} passed`);
}
csv('critical/all-hands-both-definitions.csv',criticalRows);
// Exhaustive catalogue of structurally possible critical patterns, independent of simulation.
const patterns:any[]=[];
for(const definition of ['rank','value']) for(let k=2;k<=5;k++) {
  const cap=definition==='rank'?13:10;
  for(let r=1;r<=cap;r++) if(k <= (definition==='value'&&r===10?16:4)) patterns.push({definition,cards_played:k,kind:'match',pattern:Array(k).fill(r).join('-'),total:k*Math.min(r,10)});
  for(let r=1;r<=cap-k+1;r++) {const sequence=Array.from({length:k},(_,i)=>r+i);patterns.push({definition,cards_played:k,kind:'run',pattern:sequence.join('-'),total:sequence.reduce((s,r)=>s+Math.min(r,10),0)});}
}
csv('critical/pattern-catalogue.csv',patterns);

const partyRows:any[]=[];
for(const p of [3,4,5]) for(let h=4;h<=12;h++) {
  if(p*h>52) continue;
  const start=performance.now(), seed=baseSeed+p*100+h, random=seededRandom(seed),cards=freshDeck();
  const privateAny=new Uint32Array(51),privateAll=new Uint32Array(51),privateCapable=new Uint32Array(51),pooled=new Uint32Array(51);
  for(let sample=0;sample<partySamples;sample++) {
    const values=deal(p*h,random,cards).map(r=>Math.min(r,10));
    const count=new Uint8Array(51);
    for(let c=0;c<p;c++) {const ways=subsetCounts(values.slice(c*h,(c+1)*h));for(let t=2;t<=50;t++) if([2,3,4,5].some(k=>ways[k][t]>0))count[t]++;}
    const pool=subsetCounts(values);
    for(let t=2;t<=50;t++) {privateAny[t]+=+(count[t]>0);privateAll[t]+=+(count[t]===p);privateCapable[t]+=count[t];pooled[t]+=+([2,3,4,5].some(k=>pool[k][t]>0));}
  }
  for(let t=2;t<=50;t++) {
    const [alo,ahi]=wilson(privateAny[t],partySamples),[plo,phi]=wilson(pooled[t],partySamples),[flo,fhi]=wilson(privateAll[t],partySamples);
    partyRows.push({party_size:p,private_hand_size:h,total_dealt:p*h,total:t,method:'monte_carlo',samples:partySamples,seed,
      small_shared_hand_cards:h,small_shared_hand_exact_ability_probability:exact[h-4].rows[t-2].any.probability,
      private_any_character_probability:privateAny[t]/partySamples,private_any_ci95_low:alo,private_any_ci95_high:ahi,
      private_all_characters_probability:privateAll[t]/partySamples,private_all_ci95_low:flo,private_all_ci95_high:fhi,
      private_mean_capable_characters:privateCapable[t]/partySamples,
      equal_budget_pool_cards:p*h,equal_budget_pool_ability_probability:pooled[t]/partySamples,pool_ci95_low:plo,pool_ci95_high:phi});
  }
  console.log(`Party P=${p}, H=${h}: ${((performance.now()-start)/1000).toFixed(2)}s`);
}
csv('party/shared-vs-private.csv',partyRows);
const spendRows:any[]=[],menuRows:any[]=[];
const menus=[[15,21,31],[12,21,31,41]];
for(let h=4;h<=12;h++) {
  const start=performance.now(), seed=baseSeed+1000+h,random=seededRandom(seed),cards=freshDeck();
  const reachable=new Uint32Array(51),twoChoices=new Uint32Array(51),twoDisjoint=new Uint32Array(51);
  const menuCounts=menus.map(()=>new Uint32Array(7));
  for(let sample=0;sample<spendingSamples;sample++) {
    const values=deal(h,random,cards).map(r=>Math.min(r,10));
    const {byTotal}=handSubsets(values),sum=values.reduce((a,b)=>a+b,0);
    for(let t=2;t<=50;t++) {const masks=byTotal[t];reachable[t]+=+(masks.length>0);twoChoices[t]+=+(masks.length>=2);twoDisjoint[t]+=+(sum>=2*t && hasTwoDisjoint(masks));}
    for(let m=0;m<menus.length;m++) menuCounts[m][maximumPlays(values,menus[m])]++;
  }
  for(let t=2;t<=50;t++) {const [lo,hi]=wilson(twoDisjoint[t],spendingSamples);spendRows.push({hand_size:h,total:t,method:'monte_carlo',samples:spendingSamples,seed,
    ability_probability:reachable[t]/spendingSamples,two_options_probability:twoChoices[t]/spendingSamples,two_disjoint_activations_probability:twoDisjoint[t]/spendingSamples,two_disjoint_ci95_low:lo,two_disjoint_ci95_high:hi});}
  for(let m=0;m<menus.length;m++) {const counts=menuCounts[m];menuRows.push({shared_hand_size:h,ability_menu:menus[m].join(';'),method:'monte_carlo_with_exact_per_hand_packing',samples:spendingSamples,seed,
    mean_maximum_activations:counts.reduce((sum,n,i)=>sum+n*i,0)/spendingSamples,
    ...Object.fromEntries([0,1,2,3,4,5,6].map(n=>[`probability_maximum_equals_${n}`,counts[n]/spendingSamples])),
    ...Object.fromEntries([3,4,5].map(p=>[`probability_all_${p}_characters_can_act`,counts.reduce((sum,n,i)=>sum+(i>=p?n:0),0)/spendingSamples]))});}
  console.log(`Spending H=${h}: ${((performance.now()-start)/1000).toFixed(2)}s`);
}
csv('spending/repeated-target.csv',spendRows);csv('spending/party-menu-capacity.csv',menuRows);
const manifest={generated_at:new Date().toISOString(),base_seed:baseSeed,critical_samples_per_hand:criticalSamples,party_samples_per_configuration:partySamples,spending_samples_per_hand:spendingSamples,
  exact_reports:36,exact_union_reports:9,party_configurations:partyRows.length/49,
  assumptions:['One physical 52-card deck; no replacement, no initial discards or redraws.','Ace low; J/Q/K numeric value 10; suits ignored.','Abilities accept any 2-5 cards; played cards spent.','Critical requires ALL played cards to be a run or ALL to match.','No wraparound straights. Rank runs A through K; numeric runs 1 through 10.','Opening-deal availability, not multi-round combat effectiveness.','Party deals are correlated draws from one shuffled deck. Five hands of 11 or 12 cannot be dealt and are omitted.','Party menu packing assumes every character can use every menu target once as its activation; no class-specific restrictions.'],
  numeric_validation:'For every H and k, sum of expected subset counts equals choose(H,k) within 1e-8.',
  files:{exact:'exact/hand-HH-play-K.csv',union:'exact/all-hands-any-2-to-5.csv',critical:'critical/all-hands-both-definitions.csv',patterns:'critical/pattern-catalogue.csv',party:'party/shared-vs-private.csv',spending:'spending/repeated-target.csv',menus:'spending/party-menu-capacity.csv'}};
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log('All research reports generated.');
