import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import type { Row } from '../math/analyze';
export const colors: Record<number,string> = { 2: '#57d9bd', 3: '#99b6ff', 4: '#ffc16e', 5: '#ec99d5' };
export function ProbabilityChart({ rows, selected, targets, mode }: { rows: Row[]; selected: number[]; targets: number[]; mode: 'probability' | 'averageWays' }) {
  const data = rows.map(row => ({ total: row.total, ...Object.fromEntries(selected.map(k => [`k${k}`, row.sizes[k][mode] * (mode === 'probability' ? 100 : 1)])) }));
  return <div className="chart" role="img" aria-label={`${mode === 'probability' ? 'Achievability probability' : 'Average ways'} by total; values also available in the detailed table`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 24, right: 25, bottom: 15, left: 5 }}>
    <CartesianGrid stroke="#2a3647" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="total" type="number" domain={[2,50]} ticks={[2,5,10,15,20,25,30,35,40,45,50]} stroke="#94a4b9" label={{ value:'Numeric total', position:'insideBottom', offset:-10 }}/><YAxis domain={mode === 'probability' ? [0,100] : [0,'auto']} stroke="#94a4b9" tickFormatter={v => mode === 'probability' ? `${v}%` : `${v}`}/>
    <Tooltip contentStyle={{ background:'#172131', border:'1px solid #46536a', borderRadius:8 }} formatter={value => mode === 'probability' ? `${Number(value).toFixed(2)}%` : Number(value).toFixed(3)} labelFormatter={v => `Total ${v}`}/><Legend verticalAlign="top" height={60}/>
    {targets.map(t => <ReferenceLine key={t} x={t} stroke="#a1adc0" strokeDasharray="4 4" label={{ value:`${t}`, fill:'#c7d3e3', position:'insideTopRight' }}/>) }
    {selected.map(k => <Line key={k} dataKey={`k${k}`} name={`${k}-card plays`} stroke={colors[k]} strokeWidth={2.5} dot={false} type="linear" isAnimationActive={false}/>)}
  </LineChart></ResponsiveContainer></div>;
}
