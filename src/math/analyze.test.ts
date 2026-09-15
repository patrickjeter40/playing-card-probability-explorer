import { describe, expect, it } from 'vitest';
import { deck } from './deck';
import { choose, subsetCounts } from './combinations';
import { accumulator, analyzeExact, type Config } from './analyze';
import { simulate } from './simulation';
const config: Config = {handSize:4, selected:[2,3,4], method:'exact', samples:10000, seed:123};
function brute(values: number[]) {
  const counts = Array.from({length:6}, () => new Array<number>(51).fill(0));
  for (let mask = 0; mask < 2 ** values.length; mask++) {
    let n = 0, total = 0;
    values.forEach((v,i) => { if (mask & (1 << i)) { n++; total += v; } });
    if (n <= 5) counts[n][total]++;
  }
  return counts;
}
describe('physical card subsets', () => {
  it('uses the required standard deck values and keeps suit and rank', () => {
    expect(deck).toHaveLength(52); expect(new Set(deck.map(c => c.id)).size).toBe(52);
    for (const rank of ['10','J','Q','K']) expect(deck.filter(c => c.rank === rank).map(c => c.value)).toEqual([10,10,10,10]);
    expect(deck.filter(c => c.value === 1)).toHaveLength(4);
    expect(deck.filter(c => c.value === 10)).toHaveLength(16);
  });
  it('counts [5,10] once and [5,5,10] twice at total 15', () => {
    expect(subsetCounts([5,10])[2][15]).toBe(1);
    const counts = subsetCounts([5,5,10]);
    expect(counts[2][15]).toBe(2); expect(counts[2][10]).toBe(1);
    expect(counts[3][20]).toBe(1); expect(counts[2][20]).toBe(0);
  });
  it('matches independent bitmask enumeration and never reuses a card', () => {
    for (const hand of [[1,2,3,4],[5,5,10],[1,1,1,1,10,10,10,10],[1,2,3,4,5,6,7,8,9,10,10,10]]) {
      const actual = subsetCounts(hand), expected = brute(hand);
      for (let k = 0; k <= 5; k++) {
        expect([...actual[k]]).toEqual(expected[k]);
        expect(actual[k].reduce((a,b) => a+b,0)).toBe(choose(hand.length,k));
      }
    }
  });
  it('separates achievability, expected ways, thresholds, and conditional density', () => {
    const acc = accumulator([2]); acc.add([5,5,10]); acc.add([1,2,3]);
    const metric = acc.finish().find(r => r.total === 15)!.any;
    expect(metric).toEqual({probability:.5,averageWays:1,atLeast2:.5,atLeast3:0,density:2});
  });
  it('counts union events once while combining ways across play sizes', () => {
    const acc = accumulator([2,3]); acc.add([1,2,3,3]);
    const row = acc.finish().find(r => r.total === 6)!;
    expect(row.sizes[2].averageWays).toBe(1); expect(row.sizes[3].averageWays).toBe(2);
    expect(row.any).toEqual({probability:1,averageWays:3,atLeast2:1,atLeast3:1,density:3});
  });
});
describe('weighted exact deals and simulation', () => {
  const result = analyzeExact(config);
  it('matches hypergeometric probability for at least two tens', () => {
    const expected = 1 - (choose(36,4) + 16 * choose(36,3)) / choose(52,4);
    const metric = result.rows.find(r => r.total === 20)!.sizes[2];
    expect(metric.probability).toBeCloseTo(expected,12);
    expect(metric.averageWays).toBeCloseTo(choose(4,2) * choose(16,2) / choose(52,2),12);
  });
  it('matches independent full physical-hand enumeration for a four-card hand', () => {
    let successful = 0, ways = 0, twice = 0, thrice = 0;
    for (let a = 0; a < 49; a++) for (let b = a+1; b < 50; b++) for (let c = b+1; c < 51; c++) for (let d = c+1; d < 52; d++) {
      const v = [deck[a].value,deck[b].value,deck[c].value,deck[d].value];
      let hits = 0;
      for (let mask = 1; mask < 16; mask++) {
        let n = 0, sum = 0;
        for (let i = 0; i < 4; i++) if (mask & (1 << i)) {n++; sum += v[i];}
        if (n >= 2 && sum === 15) hits++;
      }
      if (hits) successful++; if (hits >= 2) twice++; if (hits >= 3) thrice++; ways += hits;
    }
    const metric = result.rows.find(r => r.total === 15)!.any, n = choose(52,4);
    expect(metric.probability).toBeCloseTo(successful/n,12);
    expect(metric.averageWays).toBeCloseTo(ways/n,12);
    expect(metric.atLeast2).toBeCloseTo(twice/n,12);
    expect(metric.atLeast3).toBeCloseTo(thrice/n,12);
    expect(metric.density).toBeCloseTo(ways/successful,12);
  });
  it('has valid probabilities, thresholds, and expected subset totals', () => {
    for (const row of result.rows) for (const m of [...Object.values(row.sizes),row.any]) {
      expect(m.probability).toBeGreaterThanOrEqual(0); expect(m.probability).toBeLessThanOrEqual(1);
      expect(m.atLeast3).toBeLessThanOrEqual(m.atLeast2); expect(m.atLeast2).toBeLessThanOrEqual(m.probability);
    }
    for (const k of [2,3,4,5]) expect(result.rows.reduce((n,r) => n+r.sizes[k].averageWays,0)).toBeCloseTo(choose(4,k),10);
    expect(result.rows.reduce((n,r) => n+r.sizes[2].probability,0)).toBeGreaterThan(1);
    expect(result.rows.reduce((n,r) => n+r.sizes[4].probability,0)).toBeCloseTo(1,12);
  });
  it('returns empty union metrics when no play sizes are selected', () => {
    const acc = accumulator([]); acc.add([1,2,3,4]);
    expect(acc.finish().every(r => r.any.probability === 0 && r.any.density === 0)).toBe(true);
  });
  it('is reproducible and agrees with exact probabilities within sampling tolerance', () => {
    const first = simulate(config), second = simulate(config);
    expect(first).toEqual(second);
    for (let i = 0; i < result.rows.length; i++) expect(Math.abs(first.rows[i].any.probability-result.rows[i].any.probability)).toBeLessThan(.025);
  });
  it('rejects invalid input', () => {
    expect(() => analyzeExact({...config,handSize:13})).toThrow();
    expect(() => simulate({...config,samples:0})).toThrow();
  });
});
