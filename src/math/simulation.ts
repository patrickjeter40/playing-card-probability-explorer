import { accumulator, validate, type Config, type Result } from './analyze';
import { deck } from './deck';
export function seededRandom(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function simulate(config: Config, progress: (fraction: number) => void = () => {}): Result {
  validate(config);
  const acc = accumulator(config.selected), random = seededRandom(config.seed);
  const cards = deck.map(c => c.value);
  for (let sample = 0; sample < config.samples; sample++) {
    // Partial Fisher–Yates: draw physical cards uniformly without replacement.
    for (let i = 0; i < config.handSize; i++) {
      const j = i + Math.floor(random() * (52-i));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    acc.add(cards.slice(0, config.handSize));
    if (sample % 2000 === 0) progress(sample / config.samples);
  }
  return { rows: acc.finish(), observations: config.samples, method: 'simulation', handSize: config.handSize, selected: config.selected };
}
