import type { Config } from '../math/analyze';
import { playSizes } from '../math/deck';
export function Controls({ config, setConfig }: { config: Config; setConfig: (config: Config) => void }) {
  return <section className="controls panel" aria-label="Analysis controls">
    <label>Starting hand <select value={config.handSize} onChange={e => setConfig({ ...config, handSize: +e.target.value })}>{Array.from({length:9}, (_, i) => <option key={i} value={i+4}>{i+4} cards</option>)}</select></label>
    <fieldset><legend>Cards played</legend><div className="toggles">{playSizes.map(k => <label key={k}><input type="checkbox" checked={config.selected.includes(k)} onChange={e => setConfig({ ...config, selected: e.target.checked ? [...config.selected,k].sort() : config.selected.filter(n => n !== k) })}/>{k}</label>)}</div></fieldset>
    <label>Calculation <select value={config.method} onChange={e => setConfig({ ...config, method: e.target.value as Config['method'] })}><option value="exact">Exact</option><option value="simulation">Monte Carlo</option></select></label>
    {config.method === 'simulation' && <><label>Samples <select value={config.samples} onChange={e => setConfig({ ...config, samples: +e.target.value })}>{[10000,100000,1000000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}</select></label><label>Random seed <input type="number" min="0" max="4294967295" value={config.seed} onChange={e => setConfig({ ...config, seed: Number(e.target.value) >>> 0 })}/></label></>}
  </section>;
}
