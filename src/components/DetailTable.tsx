import { useState } from 'react';
import type { Result, Row } from '../math/analyze';
import { downloadResults, type ExportOptions } from '../export/csv';
import { percent } from './TargetAnalysis';
export function DetailTable({ rows, selected, targets, result, exportOptions }: { rows: Row[]; selected: number[]; targets: number[]; result: Result; exportOptions: ExportOptions }) {
  const [sort,setSort] = useState('total'), [ascending,setAscending] = useState(true);
  const columns = [{key:'total', label:'Total'}, ...selected.map(k => ({key:`p${k}`, label:`${k} cards · Probability`})), ...selected.map(k => ({key:`w${k}`, label:`${k} cards · Avg. Ways`}))];
  const activeSort = columns.some(c => c.key === sort) ? sort : 'total';
  const value = (row: Row, key: string) => key === 'total' ? row.total : row.sizes[+key.slice(1)][key[0] === 'p' ? 'probability' : 'averageWays'];
  const ordered = [...rows].sort((a,b) => (value(a,activeSort)-value(b,activeSort)) * (ascending ? 1 : -1));
  return <section className="panel"><div className="section-head"><h2>Detailed results</h2><button onClick={() => downloadResults(result, ordered, exportOptions)}>Export CSV</button></div><p>All totals, including impossible outcomes. Click a column heading to sort. Export includes current settings, selected sizes, and target metrics in this row order. CSV probabilities use 0-1 values.</p><div className="table-scroll details"><table><thead><tr>{columns.map(c => <th key={c.key} aria-sort={activeSort === c.key ? ascending ? 'ascending' : 'descending' : 'none'}><button onClick={() => { setSort(c.key); setAscending(activeSort === c.key ? !ascending : false); }}>{c.label} {activeSort === c.key ? ascending ? '↑' : '↓' : '↕'}</button></th>)}</tr></thead><tbody>{ordered.map(r => <tr className={targets.includes(r.total) ? 'highlight' : ''} key={r.total}>{columns.map(c => <td key={c.key}>{c.key === 'total' ? r.total : c.key[0] === 'p' ? percent(value(r,c.key)) : value(r,c.key).toFixed(3)}</td>)}</tr>)}</tbody></table></div></section>;
}
