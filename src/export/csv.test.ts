import { describe, expect, it } from 'vitest';
import { accumulator, type Result } from '../math/analyze';
import { resultsCsv } from './csv';

function fixture(selected = [2]): Result {
  const acc = accumulator(selected);
  acc.add([5,5,10]); acc.add([1,2,3]);
  return {rows:acc.finish(), selected, handSize:3, method:'exact', observations:2};
}
function parse(csv: string) {
  const [header, ...rows] = csv.replace(/^\uFEFF/,'').trimEnd().split('\r\n').map(line => line.split(','));
  return rows.map(row => Object.fromEntries(header.map((key,i) => [key,row[i]])));
}
const options = {targets:[15], seed:123, mode:'probability' as const};

describe('current analysis CSV export', () => {
  it('preserves display order, selected columns, precision and conditional metrics', () => {
    const result = fixture();
    const records = parse(resultsCsv(result, [...result.rows].reverse(), options));
    expect(records).toHaveLength(49);
    expect(records[0].total).toBe('50');
    const target = records.find(row => row.total === '15')!;
    expect(target.highlighted_target).toBe('true');
    expect(target['2_cards_probability_0_to_1']).toBe('0.5');
    expect(target['2_cards_average_ways']).toBe('1');
    expect(target['2_cards_decision_density']).toBe('2');
    expect(target['any_selected_size_at_least_2_ways_probability_0_to_1']).toBe('0.5');
    expect(target).not.toHaveProperty('3_cards_probability_0_to_1');
    expect(target.simulation_seed).toBe('');
    expect(records[0]['2_cards_decision_density']).toBe('');
    expect(records.find(row => row.total === '6')!.highlighted_target).toBe('false');
  });
  it('exports simulation metadata and both chart metrics from the existing result', () => {
    const result = {...fixture([2,3]), method:'simulation' as const, observations:10000};
    const row = parse(resultsCsv(result, result.rows, {...options,mode:'averageWays'}))[0];
    expect(row.calculation_method).toBe('simulation');
    expect(row.simulation_seed).toBe('123');
    expect(row.simulation_samples).toBe('10000');
    expect(row.exact_value_count_hands).toBe('');
    expect(row.selected_play_sizes).toBe('2;3');
    expect(row.chart_metric).toBe('averageWays');
    expect(row).toHaveProperty('3_cards_average_ways');
  });
  it('exports zero union metrics with no play sizes selected', () => {
    const result = fixture([]);
    const row = parse(resultsCsv(result, result.rows, options))[0];
    expect(row.selected_play_sizes).toBe('');
    expect(row.any_selected_size_probability_0_to_1).toBe('0');
    expect(row.any_selected_size_decision_density).toBe('');
    expect(row).not.toHaveProperty('2_cards_average_ways');
  });
});
