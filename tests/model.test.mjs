// Run with: npm test
// Checks the model against published anchors and basic sanity (monotonic, consistent paths).

import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/js/util.js');
await import('../assets/js/data/world.js');
await import('../assets/js/data/passports.js');
await import('../assets/js/model.js');

const { model, DATA } = globalThis.HLIA;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} +/- ${tol}, got ${a}`);

const person = (over = {}) => ({
  residence: 'DEU', birth: 'DEU', passports: ['DEU'], status: 'citizen',
  income: { amount: 3000, currency: 'LOCAL', period: 'month' },
  household: { shared: false },
  workType: 'formal', stateHelp: 'yes', support: true, savings: '3to6',
  tenure: 'rent', basics: { water: true, toilet: true, power: true, cooking: true, internet: true, food: true, housing: true },
  education: 'bachelor', health: 'high', travel: true, netWorth: { skip: true },
  ...over,
});

test('world distribution matches the World Bank headline numbers', () => {
  // PIP September 2026 update, nowcast for 2026: 9.79% below $3.00, 17.10% below $4.20, 44.41% below $8.30
  near(model.cdf(model.WF, 3.0), 0.0979, 0.003, 'share below $3.00 a day');
  near(model.cdf(model.WF, 4.2), 0.171, 0.004, 'share below $4.20 a day');
  near(model.cdf(model.WF, 8.3), 0.4441, 0.006, 'share below $8.30 a day');
  near(model.markers.median, 9.5, 0.4, 'world median $ a day (about $9.2 in 2024)');
  // Giving What We Can / Our World in Data, 2024: top 1% starts at $162.6 a day
  near(model.markers.p99, 165, 8, 'top 1% threshold a day');
  near(model.worldPop / 1e9, 8.28, 0.02, 'world population');
});

test('cdf and quantile are inverses and monotonic', () => {
  let prev = 0;
  for (let z = 0.3; z < 1000; z *= 1.07) {
    const p = model.cdf(model.WF, z);
    assert.ok(p >= prev - 1e-9, 'monotonic');
    prev = p;
  }
  for (const p of [0.05, 0.3, 0.5, 0.8, 0.95, 0.99]) near(model.cdf(model.WF, model.quantile(model.WF, p)), p, 0.002, 'round trip');
});

test('every country has a complete, increasing income curve', () => {
  for (const c of DATA.countries) {
    assert.equal(c.F.length, DATA.z.length, c.id);
    for (let k = 1; k < c.F.length; k++) assert.ok(c.F[k] >= c.F[k - 1], `${c.id} not increasing at ${k}`);
  }
});

test('the same money gives the same answer in local currency, USD and EUR', () => {
  const c = model.byId.DEU;
  const usd = 3000 / DATA.meta.eurPerUsd;
  const a = model.income(person());
  const b = model.income(person({ income: { amount: usd, currency: 'USD', period: 'month' } }));
  const e = model.income(person({ income: { amount: 3000, currency: 'EUR', period: 'month' } }));
  near(a.z, b.z, a.z * 1e-6);
  near(a.z, e.z, a.z * 1e-6);
  assert.ok(c.fx > 0);
});

test('a yearly amount equals twelve months and household size divides income', () => {
  const m = model.income(person());
  const y = model.income(person({ income: { amount: 36000, currency: 'LOCAL', period: 'year' } }));
  near(m.z, y.z, m.z * 1e-9);
  const family = model.income(person({ household: { shared: true, total: 3000, adults: 2, children: 2 } }));
  near(family.z, m.z / 4, m.z * 1e-9);
});

test('a comfortable German salary: top few percent worldwide, upper middle at home', () => {
  const r = model.income(person());
  assert.ok(r.global > 0.94 && r.global < 0.995, `global ${r.global}`);
  assert.ok(r.local > 0.6 && r.local < 0.92, `local ${r.local}`);
  assert.ok(r.global > r.local);
});

test('Argentina: peso salary is read with the country\'s own price history', () => {
  const r = model.income(person({ residence: 'ARG', passports: ['ARG'], income: { amount: 2000000, currency: 'LOCAL', period: 'month' } }));
  assert.ok(r.usdMonth > 1000 && r.usdMonth < 1600, `usd ${r.usdMonth}`);
  assert.ok(r.pppMonth > r.usdMonth * 0.8 && r.pppMonth < r.usdMonth * 2.2, `ppp ${r.pppMonth}`);
  assert.ok(r.global > 0.8 && r.global < 0.97, `global ${r.global}`);
});

test('passport power ranks Germany far above Afghanistan', () => {
  const de = model.mobility(person());
  const af = model.mobility(person({ residence: 'AFG', passports: ['AFG'] }));
  assert.ok(de.reach > 150, `DEU reach ${de.reach}`);
  assert.ok(af.reach < 50, `AFG reach ${af.reach}`);
  assert.ok(de.passportPct > 0.9 && af.passportPct < 0.1);
  const two = model.mobility(person({ passports: ['DEU', 'AFG'] }));
  assert.ok(two.reach >= de.reach - 1, 'a second passport never costs destinations');
});

test('treaty rights add places to live and work', () => {
  const r = model.mobility(person());
  assert.ok(r.live.has('FRA') && r.live.has('ESP'), 'EU free movement');
  assert.ok(r.live.size >= 25, `live ${r.live.size}`);
});

test('basics: more items means a higher percentile, in every country', () => {
  let prev = -1;
  for (let k = 0; k <= 7; k++) {
    const keys = model.BASICS.slice(0, k);
    // tenure is left out so that the seventh item (housing) is controlled by the checkbox list
    const b = model.basics(person({ tenure: null, basics: Object.fromEntries(keys.map((x) => [x, true])) }));
    assert.ok(b.global > prev, `k=${k}`);
    prev = b.global;
  }
});

test('education percentile rises with schooling', () => {
  let prev = -1;
  for (const e of model.EDU) {
    const r = model.education(person({ education: e }));
    assert.ok(r.global > prev, e);
    prev = r.global;
  }
});

test('combining agreeing areas gives a more extreme overall percentile', () => {
  const z = model.zOf(0.9);
  const overall = globalThis.HLIA.util.Phi(model.combineZ([z, z, z, z, z, z, z, z], null, model.params.rho));
  assert.ok(overall > 0.93 && overall < 0.97, `overall ${overall}`);
  const one = globalThis.HLIA.util.Phi(model.combineZ([z], null, model.params.rho));
  near(one, 0.9, 1e-6);
});

test('compute returns eight areas and sane overall numbers for three very different lives', () => {
  const lives = {
    germany: person(),
    nigeria: person({ residence: 'NGA', passports: ['NGA'], income: { amount: 150000, currency: 'LOCAL', period: 'month' }, workType: 'informal', stateHelp: 'no', savings: 'none', tenure: 'rent', basics: { water: false, toilet: false, power: false, cooking: false, internet: true, food: false, housing: false }, education: 'secondary', health: 'none', travel: false, support: true, status: 'citizen' }),
    usa: person({ residence: 'USA', passports: ['USA'], income: { amount: 9000, currency: 'LOCAL', period: 'month' }, savings: 'gt6' }),
  };
  const out = {};
  for (const [k, a] of Object.entries(lives)) {
    const r = model.compute(a);
    assert.equal(r.dims.length, 8);
    for (const d of r.dims) assert.ok(d.global >= 0 && d.global <= 1, `${k} ${d.id}`);
    out[k] = r.overall.ahead;
  }
  assert.ok(out.usa < out.germany || out.usa < 0.05, 'a high US income puts you at least as high');
  assert.ok(out.nigeria > 0.5, 'a low-income life in Nigeria sits in the lower half');
  console.log('  top share ahead of you:', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, (v * 100).toFixed(1) + '%'])));
});
