async () => {
const page = {
  eval: async fn => typeof fn === 'function' ? fn() : (0,eval)(`(${fn})()`) ,
  wait: async (selector, timeout = 60000) => {
    const start = performance.now();
    while (!document.querySelector(selector)) { if (performance.now()-start > timeout) throw new Error('Timeout: ' + selector); await new Promise(r => setTimeout(r,100)); }
  },
  click: async selector => { document.querySelector(selector).click(); await new Promise(r => setTimeout(r,50)); },
  fill: async (selector, value) => { const input = document.querySelector(selector); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r => setTimeout(r,50)); },
  open: async () => {}
};
const messages = [];
const console = {log: text => messages.push(text)};
const check = (condition, message) => { if (!condition) throw new Error(message); console.log('PASS ' + message); };
const select = async (selector, value) => {
  await page.eval(`() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', {bubbles:true})); }`);
  await new Promise(r => setTimeout(r,100));
};
await page.open('http://127.0.0.1:5173');
await page.wait('footer');
check(await page.eval(() => document.querySelectorAll('.target').length === 3), 'default target cards rendered');
check(await page.eval(() => document.querySelectorAll('.details tbody tr').length === 49), 'all 49 totals rendered');
await select('.section-head > label select', 'averageWays');
check(await page.eval(() => document.querySelector('.chart').getAttribute('aria-label').startsWith('Average ways')), 'chart metric switches');
await page.fill('input[aria-label="New target total"]', '24');
await page.click('.target-form button');
check(await page.eval(() => document.querySelectorAll('.target').length === 4), 'target added');
await page.click('button[aria-label="Remove target 24"]');
check(await page.eval(() => document.querySelectorAll('.target').length === 3), 'target removed');
await page.click('.details th button');
check(await page.eval(() => document.querySelector('.details tbody td').textContent === '50'), 'detail sort descending');
await select('.inline-controls label:last-child select', '50');
check(await page.eval(() => { const rows = [...document.querySelectorAll('.ranking tbody tr')]; const scores = rows.map(r => Math.abs(parseFloat(r.children[2].textContent)-50)); return scores.every((v,i) => i === 0 || v >= scores[i-1]); }), 'rank closest to 50 percent');
await page.click('.toggles label:last-child input');
await page.wait('footer');
check(await page.eval(() => document.querySelectorAll('.details th').length === 9), 'five-card columns enabled');
await select('.controls > label:first-child select', '12');
await page.wait('footer', 60000);
check(await page.eval(() => document.querySelector('.section-head p').textContent.startsWith('12-card')), '12-card exact calculation completes');
console.log(await page.eval(() => document.querySelector('footer').textContent));
await select('.controls > label:nth-of-type(2) select', 'simulation');
await select('.controls > label:nth-of-type(3) select', '10000');
await page.wait('footer');
check(await page.eval(() => document.querySelector('footer').textContent.includes('10,000 random hands')), 'Monte Carlo sample selection');
await select('.controls > label:first-child select', '4');
await page.wait('footer');
check(await page.eval(() => [...document.querySelectorAll('.target .size-metrics div:last-child b')].every(e => e.textContent === '0.00%')), 'five-card plays impossible with four-card hand');
await page.eval(() => document.querySelectorAll('.toggles input:checked').forEach(e => e.click()));
await new Promise(r => setTimeout(r,100));
await page.wait('footer');
check(await page.eval(() => [...document.querySelectorAll('.hero-metric strong')].every(e => e.textContent === '0.00%')), 'empty selection has zero union probability');
await select('.controls > label:first-child select', '8');
await select('.controls > label:nth-of-type(2) select', 'exact');
await page.eval(() => [...document.querySelectorAll('.toggles input')].slice(0,3).forEach(e => e.click()));
await new Promise(r => setTimeout(r,100));
await select('.section-head > label select', 'probability');
await page.wait('footer');
console.log('Browser interaction checks complete; defaults restored.');
return messages;
}
