import { useEffect, useState } from 'react';
import type { Config, Result } from './math/analyze';
import { Controls } from './components/Controls';
import { ProbabilityChart } from './components/ProbabilityChart';
import { TargetAnalysis } from './components/TargetAnalysis';
import { RankingTable } from './components/RankingTable';
import { DetailTable } from './components/DetailTable';
export default function App() {
  const [config,setConfig] = useState<Config>({ handSize:8, selected:[2,3,4], method:'exact', samples:100000, seed:2026 });
  const [result,setResult] = useState<Result | null>(null), [progress,setProgress] = useState(0), [error,setError] = useState('');
  const [mode,setMode] = useState<'probability' | 'averageWays'>('probability');
  const [targets,setTargets] = useState([15,21,31]), [target,setTarget] = useState(''), [targetError,setTargetError] = useState('');
  useEffect(() => {
    setResult(null); setProgress(0); setError('');
    const worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), {type:'module'});
    worker.onmessage = ({data}) => { if (data.result) setResult(data.result); if (data.fraction !== undefined) setProgress(data.fraction); if (data.error) setError(data.error); };
    worker.onerror = event => setError(event.message || 'Calculation worker failed. Change a control to retry.');
    worker.postMessage(config);
    return () => worker.terminate();
  }, [config]);
  return <main><header><div className="eyebrow">DESIGN LAB / 52-CARD DECK</div><h1>Playing Card <span>Probability Explorer</span></h1><p>Find reachable totals. Measure meaningful choices.</p></header>
    <Controls config={config} setConfig={setConfig}/>
    <div className="method-note"><span className="badge">{config.method === 'exact' ? 'Exact enumeration' : 'Monte Carlo estimate'}</span><span>A = 1 · 2–9 = face value · 10 / J / Q / K = 10 · dealt without replacement</span></div>
    {config.method === 'exact' && config.handSize >= 10 && <p className="notice">Larger exact hands take longer. Monte Carlo offers a faster estimate; changing controls cancels the current calculation.</p>}
    {config.method === 'simulation' && <p className="notice">Seeded simulation · worst-case approximate 95% probability margin: ±{(98/Math.sqrt(config.samples)).toFixed(2)} percentage points per estimate. Rare outcomes and Decision Density may need more samples.</p>}
    <section className="panel"><div className="section-head"><div><h2>The shape of possibility</h2><p>{config.handSize}-card hand · {config.selected.length ? `play exactly ${config.selected.join(', ')} cards` : 'Select a play size to show chart series.'}</p></div><label>Chart metric<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="probability">Probability of being able to make total</option><option value="averageWays">Average number of ways to make total</option></select></label></div>
    {error ? <p role="alert">{error}</p> : result ? <ProbabilityChart rows={result.rows} selected={config.selected} targets={targets} mode={mode}/> : <div className="loading" role="status"><strong>Analyzing {config.handSize}-card hands… {Math.floor(progress*100)}%</strong><progress max="1" value={progress}/><p>Calculations run in the background. You can keep adjusting the controls.</p></div>}
    </section>
    <section><div className="section-head"><div><h2>Target Analysis</h2><p>Union and choice metrics use the selected play sizes. Per-size probabilities show all four sizes.</p></div><form className="target-form" onSubmit={e => {e.preventDefault(); const n = Number(target); if (!Number.isInteger(n) || n < 2 || n > 50) { setTargetError('Enter a whole-number total from 2 to 50.'); return; } if (targets.includes(n)) {setTargetError('That target is already highlighted.'); return;} setTargets([...targets,n].sort((a,b)=>a-b)); setTarget(''); setTargetError(''); }}><label>Highlight a total<input aria-label="New target total" type="number" min="2" max="50" step="1" placeholder="e.g. 24" value={target} onChange={e => setTarget(e.target.value)}/></label><button type="submit">Add target</button></form></div>
    {targetError && <p role="alert">{targetError}</p>}<div className="chips">{targets.map(t => <button key={t} aria-label={`Remove target ${t}`} onClick={() => setTargets(targets.filter(n => n !== t))}>{t} <span>×</span></button>)}</div>
    {result && <TargetAnalysis rows={result.rows} targets={targets} selected={config.selected}/>}{!targets.length && <p>Add a target to inspect its decision density.</p>}</section>
    {result && <><RankingTable rows={result.rows}/><DetailTable rows={result.rows} selected={config.selected} targets={targets} result={result} exportOptions={{ targets, seed: config.seed, mode }}/><footer>{result.method === 'exact' ? `${result.observations.toLocaleString()} value-count hands enumerated, weighted by physical deals.` : `${result.observations.toLocaleString()} random hands sampled · seed ${config.seed}.`} Equal-valued cards count as separate physical choices. Probabilities across totals need not sum to 100%.</footer></>}
  </main>;
}
