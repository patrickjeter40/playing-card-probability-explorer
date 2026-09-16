import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {exactCardCountTiers,maximumPlays} from '../src/research/mechanics';
import {seededRandom} from '../src/math/simulation';
const exact=JSON.parse(readFileSync('reports/exact/results.json','utf8'));
mkdirSync('reports/card-count',{recursive:true});
const rows:any[]=[],capacity:any[]=[];
function csv(path:string,data:any[]){const keys=Object.keys(data[0]);writeFileSync(path,[keys.join(','),...data.map(r=>keys.map(k=>r[k]).join(','))].join('\r\n')+'\r\n');}
for(let h=4;h<=12;h++){
  const tiers=exactCardCountTiers(h);
  const handRows=[];
  for(let t=2;t<=50;t++){
    const row=tiers[t],m=exact[h-4].rows[t-2],probability=m.any.probability;
    if(Math.abs(row.highest[5]-m.sizes[5].probability)>1e-12||Math.abs(1-row.highest[0]-probability)>1e-12)throw Error('Card-count tier cross-check failed');
    const r={hand_size:h,total:t,method:'exact',ability_probability:probability,
      ...Object.fromEntries([2,3,4,5].map(k=>[`can_play_${k}_cards_probability`,m.sizes[k].probability])),
      ...Object.fromEntries([0,2,3,4,5].map(k=>[`highest_available_tier_${k}_probability`,row.highest[k]])),
      probability_can_play_at_least_4_cards:row.highest[4]+row.highest[5],
      five_card_option_given_ability:probability?row.highest[5]/probability:'',
      four_or_five_card_option_given_ability:probability?(row.highest[4]+row.highest[5])/probability:'',
      mean_minimum_cards_given_ability:probability?row.lowest.reduce((s,p,k)=>s+p*k,0)/probability:'',
      mean_maximum_cards_given_ability:probability?row.highest.reduce((s,p,k)=>s+p*k,0)/probability:'',
      both_two_and_five_available_probability:row.bothTwoAndFive};
    handRows.push(r);rows.push(r);
  }
  csv(`reports/card-count/hand-${String(h).padStart(2,'0')}-tiers.csv`,handRows);
  const samples=5000,seed=20260915+2000+h,random=seededRandom(seed),deck=Array.from({length:52},(_,i)=>i%13+1);
  const modes=[[2,3,4,5],[2],[3],[4],[5]],counts=modes.map(()=>new Uint32Array(7));
  for(let n=0;n<samples;n++){
    for(let i=0;i<h;i++){const j=i+Math.floor(random()*(52-i));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const values=deck.slice(0,h).map(r=>Math.min(r,10));
    modes.forEach((sizes,i)=>counts[i][maximumPlays(values,[15,21,31],sizes)]++);
  }
  modes.forEach((sizes,i)=>capacity.push({hand_size:h,menu:'15;21;31',allowed_sizes:sizes.join(';'),method:'monte_carlo_with_exact_per_hand_packing',samples,seed,
    mean_maximum_activations:counts[i].reduce((s,n,k)=>s+n*k,0)/samples,
    ...Object.fromEntries([1,2,3,4,5].map(p=>[`probability_at_least_${p}_activations`,counts[i].reduce((s,n,k)=>s+(k>=p?n:0),0)/samples]))}));
  console.log(`Card-count tiers and spending H=${h} complete`);
}
csv('reports/card-count/all-hands-tiers.csv',rows);csv('reports/card-count/party-capacity-by-tier.csv',capacity);
const manifest=JSON.parse(readFileSync('reports/manifest.json','utf8'));
manifest.card_count_tiers='Exact joint highest/lowest available cardinality for every total; not derived by subtracting overlapping marginal probabilities.';
manifest.card_count_capacity_samples_per_hand=5000;manifest.files.card_count='card-count/all-hands-tiers.csv';manifest.files.card_count_capacity='card-count/party-capacity-by-tier.csv';
manifest.critical_methods={rank:'100000 seeded physical hands per H',value:'Exact weighted numeric-hand enumeration, independently cross-checked against simulation'};
writeFileSync('reports/manifest.json',JSON.stringify(manifest,null,2)+'\n');
