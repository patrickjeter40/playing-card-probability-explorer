import { choose, subsetCounts } from './combinations';
import { multiplicities, playSizes } from './deck';
export interface Metric { probability: number; averageWays: number; atLeast2: number; atLeast3: number; density: number }
export interface Row { total: number; sizes: Record<number, Metric>; any: Metric }
export interface Result { rows: Row[]; observations: number; method: 'exact' | 'simulation'; handSize: number; selected: number[] }
export interface Config { handSize: number; selected: number[]; method: 'exact' | 'simulation'; samples: number; seed: number }
const blank = (): Metric => ({ probability: 0, averageWays: 0, atLeast2: 0, atLeast3: 0, density: 0 });
export function accumulator(selected: readonly number[]) {
  const rows: Row[] = Array.from({ length: 49 }, (_, i) => ({ total: i+2, sizes: Object.fromEntries(playSizes.map(k => [k, blank()])), any: blank() }));
  let weightSum = 0;
  function addMetric(m: Metric, count: number, weight: number) {
    if (count > 0) m.probability += weight;
    m.averageWays += count * weight;
    if (count >= 2) m.atLeast2 += weight;
    if (count >= 3) m.atLeast3 += weight;
  }
  return {
    add(values: readonly number[], weight = 1) {
      weightSum += weight;
      const ways = subsetCounts(values);
      for (const row of rows) {
        for (const k of playSizes) addMetric(row.sizes[k], ways[k][row.total], weight);
        addMetric(row.any, selected.reduce((sum, k) => sum + ways[k][row.total], 0), weight);
      }
    },
    finish() {
      for (const row of rows) for (const m of [...Object.values(row.sizes), row.any]) {
        m.density = m.probability ? m.averageWays / m.probability : 0;
        m.probability /= weightSum; m.averageWays /= weightSum; m.atLeast2 /= weightSum; m.atLeast3 /= weightSum;
      }
      return rows;
    },
    get weight() { return weightSum; }
  };
}
export function validate(config: Config) {
  if (!Number.isInteger(config.handSize) || config.handSize < 4 || config.handSize > 12) throw new Error('Hand size must be 4–12.');
  if (new Set(config.selected).size !== config.selected.length || config.selected.some(k => !playSizes.includes(k as 2))) throw new Error('Invalid play sizes.');
  if (!Number.isInteger(config.samples) || config.samples < 1 || config.samples > 1000000) throw new Error('Invalid sample count.');
}
export function analyzeExact(config: Config, progress: (fraction: number) => void = () => {}): Result {
  validate(config);
  const acc = accumulator(config.selected);
  const values: number[] = [];
  const totalWeight = choose(52, config.handSize);
  let observations = 0;
  function visit(index: number, remaining: number, weight: number) {
    if (index === multiplicities.length) {
      if (remaining !== 0) return;
      acc.add(values, weight); observations++;
      if (observations % 2000 === 0) progress(acc.weight / totalWeight);
      return;
    }
    const capacityAfter = multiplicities.slice(index+1).reduce((a,b) => a+b, 0);
    for (let count = Math.max(0, remaining-capacityAfter); count <= Math.min(remaining, multiplicities[index]); count++) {
      const length = values.length;
      for (let i = 0; i < count; i++) values.push(index+1);
      visit(index+1, remaining-count, weight * choose(multiplicities[index], count));
      values.length = length;
    }
  }
  visit(0, config.handSize, 1);
  return { rows: acc.finish(), observations, method: 'exact', handSize: config.handSize, selected: config.selected };
}
