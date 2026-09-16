import { describe, expect, it } from 'vitest';
import { criticalCounts, handSubsets, hasTwoDisjoint, maximumPlays, wilson, exactValueCritical, exactCardCountTiers } from './mechanics';
import { choose, subsetCounts } from '../math/combinations';

describe('critical definitions and spent cards', () => {
  it('finds highest available card-count tiers with exact total probability mass', () => {
    const rows=exactCardCountTiers(4);
    for(let t=2;t<=50;t++)expect(rows[t].highest.reduce((a,b)=>a+b,0)).toBeCloseTo(1,12);
    expect(rows[40].highest[4]).toBeCloseTo(choose(16,4)/choose(52,4),12);
    expect(rows[40].highest[2]).toBe(0);
    expect(rows[40].highest[5]).toBe(0);
    expect(rows[41].highest[0]).toBe(1);
    expect(rows[15].bothTwoAndFive).toBe(0);
  });
  it('respects card-count restrictions when optimizing spent cards', () => {
    expect(maximumPlays([5,5,10,10],[15],[2])).toBe(2);
    expect(maximumPlays([5,5,10,10],[15],[3,4,5])).toBe(0);
    expect(maximumPlays([1,2,3,4],[10],[4])).toBe(1);
  });
  it('matches hypergeometric probabilities and expected ways for numeric ten pairs', () => {
    const result=exactValueCritical(4)[2][20];
    const expected=1-(choose(36,4)+16*choose(36,3))/choose(52,4);
    expect(result.either).toBeCloseTo(expected,12);
    expect(result.match).toBeCloseTo(expected,12);
    expect(result.run).toBe(0);
    expect(result.ways).toBeCloseTo(choose(4,2)*choose(16,2)/choose(52,2),12);
  });
  it('distinguishes face ranks from equal numeric values', () => {
    const ranks = [10,11,12,13];
    expect(criticalCounts(ranks,'rank').matches[2][20]).toBe(0);
    expect(criticalCounts(ranks,'value').matches[2][20]).toBe(6);
    expect(criticalCounts(ranks,'rank').runs[4][40]).toBe(1);
    expect(criticalCounts(ranks,'value').runs[4][40]).toBe(0);
  });
  it('supports numeric runs through ten but rank runs through King, Ace low only', () => {
    expect(criticalCounts([9,11],'rank').runs[2][19]).toBe(0);
    expect(criticalCounts([9,11],'value').runs[2][19]).toBe(1);
    expect(criticalCounts([1,13],'rank').runs[2][11]).toBe(0);
    expect(criticalCounts([1,2,3],'rank').runs[3][6]).toBe(1);
    expect(criticalCounts([10,10,11],'rank').runs[2][20]).toBe(2);
  });
  it('matches independent physical-subset enumeration for both critical definitions', () => {
    const ranks = [1,2,2,3,8,9,10,11,12,13];
    for (const def of ['rank','value'] as const) {
      const expected = criticalCounts([],def);
      for (let mask = 1; mask < 1<<ranks.length; mask++) {
        const cards = ranks.filter((_,i)=>mask & (1<<i));
        if (cards.length < 2 || cards.length > 5) continue;
        const total = cards.reduce((s,r)=>s+Math.min(r,10),0);
        const ordered = cards.map(r=>def==='rank'?r:Math.min(r,10)).sort((a,b)=>a-b);
        if (ordered.every(r=>r===ordered[0])) expected.matches[cards.length][total]++;
        if (ordered.every((r,i)=>r===ordered[0]+i)) expected.runs[cards.length][total]++;
      }
      expect(criticalCounts(ranks,def)).toEqual(expected);
    }
  });
  it('separates overlapping options from repeated activations', () => {
    const hand = [5,5,10];
    expect(subsetCounts(hand)[2][15]).toBe(2);
    expect(hasTwoDisjoint(handSubsets(hand).byTotal[15])).toBe(false);
    expect(maximumPlays(hand,[15])).toBe(1);
    expect(hasTwoDisjoint(handSubsets([5,5,10,10]).byTotal[15])).toBe(true);
    expect(maximumPlays([5,5,10,10],[15])).toBe(2);
  });
  it('finds an optimal packing rather than spending greedily', () => {
    const values = [1,2,3,4,5,6,7,8];
    const targets = [9,15];
    const masks = targets.flatMap(t=>handSubsets(values).byTotal[t]);
    let best = 0;
    function brute(remaining:number, used:number) {
      best = Math.max(best,used);
      for (const mask of masks) if ((remaining & mask)===mask) brute(remaining ^ mask,used+1);
    }
    brute((1<<values.length)-1,0);
    expect(maximumPlays(values,targets)).toBe(best);
    expect(maximumPlays([10,10,10,10,10],[50])).toBe(1);
  });
  it('gives nonzero uncertainty when no successes are observed', () => {
    expect(wilson(0,100000)[1]).toBeGreaterThan(0);
    expect(wilson(100000,100000)[0]).toBeLessThan(1);
  });
});
