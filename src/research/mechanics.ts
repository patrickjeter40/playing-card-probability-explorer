import { choose, subsetCounts } from '../math/combinations';

export type CriticalDefinition = 'rank' | 'value';
export function criticalCounts(ranks: readonly number[], definition: CriticalDefinition) {
  const cap = definition === 'rank' ? 13 : 10;
  const counts = new Array<number>(cap + 1).fill(0);
  ranks.forEach(rank => counts[definition === 'rank' ? rank : Math.min(rank,10)]++);
  const runs = Array.from({length:6}, () => new Float64Array(51));
  const matches = Array.from({length:6}, () => new Float64Array(51));
  for (let k = 2; k <= 5; k++) {
    for (let rank = 1; rank <= cap; rank++) matches[k][k * Math.min(rank,10)] += choose(counts[rank],k);
    for (let start = 1; start <= cap-k+1; start++) {
      let ways = 1, total = 0;
      for (let rank = start; rank < start+k; rank++) { ways *= counts[rank]; total += Math.min(rank,10); }
      runs[k][total] += ways;
    }
  }
  return { runs, matches };
}

export function handSubsets(values: readonly number[]) {
  if (values.length > 12) throw new Error('Spending analysis supports at most 12 cards.');
  const limit = 1 << values.length;
  const sums = new Uint16Array(limit), sizes = new Uint8Array(limit);
  const byTotal = Array.from({length:51}, () => [] as number[]);
  for (let mask = 1; mask < limit; mask++) {
    const bit = mask & -mask, rest = mask ^ bit;
    sums[mask] = sums[rest] + values[31-Math.clz32(bit)];
    sizes[mask] = sizes[rest]+1;
    if (sizes[mask] >= 2 && sizes[mask] <= 5 && sums[mask] <= 50) byTotal[sums[mask]].push(mask);
  }
  return {byTotal,sums,sizes};
}

export function hasTwoDisjoint(masks: readonly number[]) {
  for (let i = 0; i < masks.length; i++) for (let j = i+1; j < masks.length; j++) if (!(masks[i] & masks[j])) return true;
  return false;
}

// Exact optimization within one sampled hand: each card may be spent only once.
// Identical target menu available to every character; no refill or positional restrictions.
export function maximumPlays(values: readonly number[], targets: readonly number[], allowedSizes: readonly number[] = [2,3,4,5]) {
  const {byTotal,sums,sizes} = handSubsets(values);
  const full = (1 << values.length)-1, minTarget = Math.min(...targets);
  const byCard = Array.from({length:values.length}, () => [] as number[]);
  for (const target of new Set(targets)) for (const mask of byTotal[target] ?? []) {
    if (!allowedSizes.includes(sizes[mask])) continue;
    for (let i = 0; i < values.length; i++) if (mask & (1<<i)) byCard[i].push(mask);
  }
  const memo = new Int8Array(full+1).fill(-1);
  function visit(mask: number): number {
    if (!mask || sums[mask] < minTarget || sizes[mask] < 2) return 0;
    if (memo[mask] >= 0) return memo[mask];
    const first = mask & -mask, index = 31-Math.clz32(first);
    const bound = Math.min(Math.floor(sizes[mask]/2), Math.floor(sums[mask]/minTarget));
    let best = visit(mask ^ first);
    if (best < bound) for (const play of byCard[index]) if ((play & mask) === play) {
      best = Math.max(best,1+visit(mask ^ play));
      if (best === bound) break;
    }
    return memo[mask] = best;
  }
  return visit(full);
}

export function wilson(successes: number, samples: number): [number,number] {
  const z2 = 1.96 ** 2, p = successes/samples;
  const center = (p + z2/(2*samples))/(1+z2/samples);
  const radius = 1.96*Math.sqrt(p*(1-p)/samples + z2/(4*samples*samples))/(1+z2/samples);
  return [Math.max(0,center-radius),Math.min(1,center+radius)];
}

export function exactValueCritical(handSize: number) {
  const distribution = [4,4,4,4,4,4,4,4,4,16];
  const hit = Array.from({length:6},()=>Array.from({length:51},()=>({run:0,match:0,either:0,ways:0})));
  const values:number[]=[];
  let weightSum=0;
  function visit(index:number,left:number,weight:number) {
    if(index===10) {
      if(left) return;
      weightSum+=weight;
      const counts=criticalCounts(values,'value');
      for(let t=2;t<=50;t++) {
        let run=0,match=0;
        for(let k=2;k<=5;k++) { const r=counts.runs[k][t],m=counts.matches[k][t],a=hit[k][t];a.run+=(r?weight:0);a.match+=(m?weight:0);a.either+=(r+m?weight:0);a.ways+=(r+m)*weight;run+=r;match+=m; }
        const a=hit[0][t];a.run+=(run?weight:0);a.match+=(match?weight:0);a.either+=(run+match?weight:0);a.ways+=(run+match)*weight;
      }
      return;
    }
    for(let n=0;n<=Math.min(left,distribution[index]);n++) {
      const length=values.length;
      for(let i=0;i<n;i++)values.push(index+1);
      visit(index+1,left-n,weight*choose(distribution[index],n));values.length=length;
    }
  }
  visit(0,handSize,1);
  if(weightSum!==choose(52,handSize))throw Error('Exact critical deal weights do not sum to all hands');
  for(const row of hit)for(const metric of row)for(const key of ['run','match','either','ways'] as const)metric[key]/=weightSum;
  return hit;
}

export function exactCardCountTiers(handSize: number) {
  const distribution=[4,4,4,4,4,4,4,4,4,16];
  const rows=Array.from({length:51},()=>({highest:new Float64Array(6),lowest:new Float64Array(6),bothTwoAndFive:0}));
  const values:number[]=[];
  let weightSum=0;
  function visit(index:number,left:number,weight:number) {
    if(index===10) {
      if(left)return;
      weightSum+=weight;
      const ways=subsetCounts(values);
      for(let t=2;t<=50;t++) {
        const available=[2,3,4,5].filter(k=>ways[k][t]>0);
        const row=rows[t];
        row.highest[available.at(-1)??0]+=weight;row.lowest[available[0]??0]+=weight;
        if(ways[2][t]&&ways[5][t])row.bothTwoAndFive+=weight;
      }
      return;
    }
    for(let n=0;n<=Math.min(left,distribution[index]);n++) {
      const length=values.length;
      for(let i=0;i<n;i++)values.push(index+1);
      visit(index+1,left-n,weight*choose(distribution[index],n));values.length=length;
    }
  }
  visit(0,handSize,1);
  if(weightSum!==choose(52,handSize))throw Error('Card-count tier weights failed');
  for(const row of rows){for(let k=0;k<=5;k++){row.highest[k]/=weightSum;row.lowest[k]/=weightSum;}row.bothTwoAndFive/=weightSum;}
  return rows;
}
