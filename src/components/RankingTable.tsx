import { useState } from 'react';
import type { Row } from '../math/analyze';
import { playSizes } from '../math/deck';
import { percent, densityHelp } from './TargetAnalysis';
export function RankingTable({ rows }: { rows: Row[] }) {
  const [size,setSize] = useState(3), [order,setOrder] = useState('highest');
  const score = (row: Row) => { const m = row.sizes[size]; return order === 'density' ? -m.density : order === 'lowest' ? m.probability : order === '50' ? Math.abs(m.probability-.5) : order === '75' ? Math.abs(m.probability-.75) : -m.probability; };
  const ranked = rows.filter(r => r.total >= size && r.total <= size*10).sort((a,b) => score(a)-score(b) || a.total-b.total);
  return <section className="panel"><div className="section-head"><div><h2>Compare targets</h2><p>Rank totals within the numeric range of a play size.</p></div><div className="inline-controls"><label>Play size<select value={size} onChange={e => setSize(+e.target.value)}>{playSizes.map(k => <option key={k} value={k}>{k} cards</option>)}</select></label><label>Rank by<select value={order} onChange={e => setOrder(e.target.value)}><option value="highest">Highest probability</option><option value="density">Highest Decision Density</option><option value="lowest">Lowest probability</option><option value="50">Closest to 50%</option><option value="75">Closest to 75%</option></select></label></div></div>
    <div className="table-scroll ranking"><table><thead><tr><th>Rank</th><th>Total</th><th>Achievable</th><th title={densityHelp}>Decision Density ⓘ</th><th>Average Ways</th></tr></thead><tbody>{ranked.map((r,i) => <tr key={r.total}><td>{i+1}</td><th>{r.total}</th><td>{percent(r.sizes[size].probability)}</td><td>{r.sizes[size].probability ? r.sizes[size].density.toFixed(2) : '—'}</td><td>{r.sizes[size].averageWays.toFixed(3)}</td></tr>)}</tbody></table></div>
  </section>;
}
