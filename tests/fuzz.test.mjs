// Run with: npm test
// Throws random lives at the model, in every country, and checks that nothing breaks:
// no exceptions, no NaN, every percentile between 0 and 1, and more income never lowers your place.

import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../assets/js/util.js');
await import('../assets/js/data/world.js');
await import('../assets/js/data/passports.js');
await import('../assets/js/model.js');

const { model, DATA, util } = globalThis.HLIA;

// a small seeded generator, so a failure can be repeated
const rand = util.rng(20261027);
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;

const BASIC_KEYS = ['water', 'toilet', 'power', 'cooking', 'internet', 'food', 'housing'];

function randomLife(c) {
  const ids = DATA.countries.map((x) => x.id);
  const passports = [chance(0.8) ? c.id : pick(ids)];
  if (chance(0.25)) passports.push(pick(ids));
  const hh = chance(0.5) ? { shared: false } : { shared: true, total: Math.round(200 + rand() * 20000), adults: 1 + Math.floor(rand() * 3), children: Math.floor(rand() * 4) };
  return {
    residence: c.id, birth: chance(0.8) ? c.id : pick(ids), passports,
    status: pick(['citizen', 'permanent', 'temporary', 'insecure']),
    income: { amount: Math.round(Math.exp(rand() * 12)) * (chance(0.1) ? 0 : 1), currency: pick(['LOCAL', 'USD', 'EUR']), period: pick(['month', 'year']) },
    household: hh,
    workType: pick(['formal', 'selfstable', 'informal', 'none']),
    stateHelp: pick(['yes', 'partly', 'no']), support: chance(0.6), savings: pick(['none', 'lt3', '3to6', 'gt6']),
    tenure: pick(['own', 'mortgage', 'rent', 'insecure', null]),
    basics: Object.fromEntries(BASIC_KEYS.map((k) => [k, chance(0.7)])),
    education: pick(model.EDU), health: pick(['none', 'basic', 'high']), travel: chance(0.4),
    netWorth: chance(0.4) ? { skip: true } : { bracket: pick(['neg', 'b0', 'b1', 'b2', 'b3']) },
  };
}

const inUnit = (x) => Number.isFinite(x) && x >= 0 && x <= 1;

test('random lives in every country give finite, bounded results', () => {
  let runs = 0;
  for (const c of DATA.countries) {
    for (let k = 0; k < 6; k++) {
      const a = randomLife(c);
      let r;
      try { r = model.compute(a); } catch (e) { assert.fail(`${c.id} threw: ${e.message}\n${JSON.stringify(a)}`); }
      assert.equal(r.dims.length, 8, c.id);
      for (const d of r.dims) {
        assert.ok(inUnit(d.global), `${c.id} ${d.id} global ${d.global}\n${JSON.stringify(a)}`);
        assert.ok(d.local == null || inUnit(d.local), `${c.id} ${d.id} local ${d.local}`);
        assert.ok(inUnit(d.typical), `${c.id} ${d.id} typical ${d.typical}`);
      }
      assert.ok(inUnit(r.overall.pct), `${c.id} overall ${r.overall.pct}`);
      assert.ok(Math.abs(r.overall.pct + r.overall.ahead - 1) < 1e-9, `${c.id} pct and ahead must add up`);
      assert.ok(r.overall.behind >= 0 && r.overall.behind <= model.worldPop * 1.0001, `${c.id} behind ${r.overall.behind}`);
      // zero is allowed: "no income of my own" is a real answer
      assert.ok(Number.isFinite(r.income.z) && r.income.z >= 0, `${c.id} income z ${r.income.z}`);
      runs++;
    }
  }
  assert.ok(runs >= DATA.countries.length * 6);
});

test('more income never lowers the income area or the overall place', () => {
  for (const c of DATA.countries.filter((_, i) => i % 4 === 0)) {
    const base = randomLife(c);
    base.income.currency = 'LOCAL'; base.income.period = 'month'; base.household = { shared: false };
    let prevIncome = -1, prevOverall = -1;
    for (const amount of [1, 10, 100, 1000, 10000, 100000, 1e6, 1e7, 1e8]) {
      const r = model.compute({ ...base, income: { ...base.income, amount } });
      const inc = r.dims.find((d) => d.id === 'income').global;
      assert.ok(inc >= prevIncome - 1e-9, `${c.id} income area fell at ${amount}`);
      assert.ok(r.overall.pct >= prevOverall - 1e-9, `${c.id} overall fell at ${amount}`);
      prevIncome = inc; prevOverall = r.overall.pct;
    }
  }
});
