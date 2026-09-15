import { analyzeExact, type Config } from './math/analyze';
import { simulate } from './math/simulation';
self.onmessage = ({ data }: MessageEvent<Config>) => {
  try {
    const progress = (fraction: number) => self.postMessage({ fraction });
    const result = data.method === 'exact' ? analyzeExact(data, progress) : simulate(data, progress);
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: String(error) }); }
};
