export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n-k); i++) result = result * (n-i+1) / i;
  return Math.round(result);
}
// Descending updates ensure each physical card can be selected only once.
export function subsetCounts(values: readonly number[]): Float64Array[] {
  const ways = Array.from({ length: 6 }, () => new Float64Array(51));
  ways[0][0] = 1;
  let seen = 0;
  for (const value of values) {
    seen++;
    for (let k = Math.min(seen, 5); k >= 1; k--)
      for (let total = Math.min(50, k * 10); total >= value; total--)
        ways[k][total] += ways[k-1][total-value];
  }
  return ways;
}
