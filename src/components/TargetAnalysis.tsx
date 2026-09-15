import type { Row } from '../math/analyze';
import { playSizes } from '../math/deck';
import { colors } from './ProbabilityChart';
export const percent = (v: number) => `${(v*100).toFixed(2)}%`;
export const densityHelp = 'Average valid physical-card subsets in successful hands only: Average Ways divided by Achievability Probability.';
export function TargetAnalysis({ rows, targets, selected }: { rows: Row[]; targets: number[]; selected: number[] }) {
  return <div className="target-grid">{targets.map(target => {
    const row = rows.find(r => r.total === target)!;
    return <article className="panel target" key={target}><div className="section-head"><h3>Target <span>{target}</span></h3><span className="eyebrow">{selected.join(' / ') || 'No'} cards</span></div>
      <div className="hero-metric"><strong>{percent(row.any.probability)}</strong><span title="Probability that at least one valid subset exists. A hand is counted once regardless of how many ways succeed.">Achievable · any selected size</span></div>
      <div className="density" title={densityHelp}><strong>{row.any.probability ? row.any.density.toFixed(2) : '—'}</strong><span>Decision Density ⓘ</span></div>
      <div className="size-metrics">{playSizes.map(k => <div key={k}><span style={{color:colors[k]}}>{k} cards</span><b>{percent(row.sizes[k].probability)}</b></div>)}</div>
      <dl><div><dt title="Expected number of valid subsets per dealt hand, including unsuccessful hands.">Average Ways ⓘ</dt><dd>{row.any.averageWays.toFixed(3)}</dd></div><div><dt>At least 2 ways</dt><dd>{percent(row.any.atLeast2)}</dd></div><div><dt>At least 3 ways</dt><dd>{percent(row.any.atLeast3)}</dd></div></dl>
    </article>;
  })}</div>;
}
