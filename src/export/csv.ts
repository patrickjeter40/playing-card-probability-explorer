import type { Metric, Result, Row } from '../math/analyze';

export interface ExportOptions {
  targets: number[];
  seed: number;
  mode: 'probability' | 'averageWays';
}

const metricHeaders = (prefix: string) => [
  `${prefix}_probability_0_to_1`, `${prefix}_average_ways`,
  `${prefix}_decision_density`, `${prefix}_at_least_2_ways_probability_0_to_1`,
  `${prefix}_at_least_3_ways_probability_0_to_1`,
];
const metricValues = (metric: Metric) => [
  metric.probability, metric.averageWays, metric.probability ? metric.density : '',
  metric.atLeast2, metric.atLeast3,
];
const cell = (value: string | number | boolean) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// The caller supplies the displayed row order; export the existing analysis without resampling.
export function resultsCsv(result: Result, rows: Row[], options: ExportOptions): string {
  const headers = [
    'total', 'highlighted_target', 'hand_size', 'selected_play_sizes', 'calculation_method',
    'chart_metric', 'simulation_samples', 'simulation_seed', 'exact_value_count_hands',
    ...result.selected.flatMap(k => metricHeaders(`${k}_cards`)), ...metricHeaders('any_selected_size'),
  ];
  const records = rows.map(row => [
    row.total, options.targets.includes(row.total), result.handSize, result.selected.join(';'), result.method,
    options.mode, result.method === 'simulation' ? result.observations : '',
    result.method === 'simulation' ? options.seed : '', result.method === 'exact' ? result.observations : '',
    ...result.selected.flatMap(k => metricValues(row.sizes[k])), ...metricValues(row.any),
  ]);
  return '\uFEFF' + [headers, ...records].map(record => record.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function downloadResults(result: Result, rows: Row[], options: ExportOptions): void {
  const blob = new Blob([resultsCsv(result, rows, options)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `card-probabilities-hand-${result.handSize}-play-${result.selected.join('-') || 'none'}-${result.method}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to start consuming the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
