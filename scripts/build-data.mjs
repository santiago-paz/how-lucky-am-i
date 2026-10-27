// Build the data files the site loads (assets/js/data/world.js and passports.js).
//
// Inputs live in data-raw/ (filled by the fetch scripts) and data/curated/ (small hand-checked
// tables). Output is plain JavaScript that sets window.HLIA.DATA, so the site also works when
// index.html is opened straight from disk.
//
// Rule for gaps: where a country has no value we copy the median of countries in the same
// World Bank income group, and we record the field name in the country's `est` list so the
// interface can say "estimated from similar countries".

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parseCSV, parseCSVObjects } from './lib/csv.mjs';

const read = (p) => readFile(p, 'utf8');
const json = async (p) => JSON.parse(await read(p));
const maybeJSON = async (p) => (existsSync(p) ? json(p) : null);

// ---------- math helpers ----------
const erf = (x) => {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
const median = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)).sort((p, q) => p - q); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const round = (x, d = 2) => (x == null ? null : +x.toFixed(d));

// ---------- load raw ----------
const mledoze = await json('data-raw/misc/countries.json');
const PIP_YEAR = Number(process.env.PIP_YEAR || 2026);
const pip = await json(`data-raw/pip/${PIP_YEAR}/pip-${PIP_YEAR}.json`);
const wbMeta = await json('data-raw/wdi/_countries.json');
const fx = await json('data-raw/misc/fx-usd.json');
const gho = (await json('data-raw/misc/gho-uhc.json')).value;
const hdr = parseCSVObjects(await read('data-raw/misc/hdr25.csv'));
const matrix = parseCSV(await read('data-raw/misc/passport-matrix-iso3.csv'));
const wealthCurated = await maybeJSON('data/curated/wealth.json');
const blocs = await maybeJSON('data/curated/blocs.json');

async function wdiLatest(key) {
  const f = `data-raw/wdi/${key}.json`;
  if (!existsSync(f)) return {};
  const { rows } = await json(f);
  const out = {};
  for (const r of rows) {
    if (r.value == null || !r.countryiso3code) continue;
    const cur = out[r.countryiso3code];
    if (!cur || +r.date > cur.y) out[r.countryiso3code] = { v: r.value, y: +r.date };
  }
  return out;
}
async function wdiYear(key, year) {
  const f = `data-raw/wdi/${key}.json`;
  if (!existsSync(f)) return {};
  const { rows } = await json(f);
  const out = {};
  for (const r of rows) if (r.value != null && r.countryiso3code && +r.date === year) out[r.countryiso3code] = r.value;
  return out;
}

const KEYS = ['emergencyFunds', 'pop', 'pop0014', 'gnipc', 'life', 'u5', 'oop', 'elec', 'cooking', 'water', 'waterBasic', 'sanitation', 'sanitationBasic', 'internet', 'vulnerable', 'literacy', 'homicide', 'polStability', 'ruleOfLaw', 'govEffectiveness', 'voice', 'corruption', 'slums', 'urban', 'foodInsecure', 'undernourished', 'inflation', 'attPrimary', 'attLowerSec', 'attUpperSec', 'attShortTertiary', 'attBachelor', 'attMaster', 'attDoctoral', 'pppPrivate2021', 'pppGdp2021', 'cpi', 'fx'];
const W = {};
for (const k of KEYS) W[k] = await wdiLatest(k);
const cpi2021 = await wdiYear('cpi', 2021);
const fx2021 = await wdiYear('fx', 2021);
const fx2025 = W.fx;

// ---------- master list: the 199 passports of the Passport Index ----------
const header = matrix[0].slice(1);
const ids = header; // rows and columns share the same 199 codes
const rowsByPassport = Object.fromEntries(matrix.slice(1).map((r) => [r[0], r.slice(1)]));

const byCca3 = Object.fromEntries(mledoze.map((c) => [c.cca3, c]));
const wbById = Object.fromEntries(wbMeta.map((c) => [c.id, c]));

// Manual facts for codes that the open datasets do not cover.
const MANUAL = {
  XKX: { n: 'Kosovo', es: 'Kosovo', n3: '383', iso2: 'XK', cur: 'EUR', inc: 'UM', region: 'Europe & Central Asia' },
  TWN: { inc: 'H' },
  VAT: { inc: 'H', pop: 800 },
};
const CURRENCY_OVERRIDE = { PAN: 'USD', KHM: 'KHR', PSE: 'ILS', ZWE: 'USD', FSM: 'USD', PRK: 'KPW', CUB: 'CUP', BTN: 'BTN', BHS: 'BSD', BRN: 'BND', LSO: 'LSL', NAM: 'NAD', SWZ: 'SZL' };
const INC = { 'High income': 'H', 'Upper middle income': 'UM', 'Lower middle income': 'LM', 'Low income': 'L' };

const countries = ids.map((id) => {
  const m = byCca3[id];
  const wb = wbById[id];
  const man = MANUAL[id] || {};
  const cur = CURRENCY_OVERRIDE[id] || man.cur || (m && m.currencies ? Object.keys(m.currencies)[0] : null) || 'USD';
  const c = {
    id,
    iso2: man.iso2 || (m && m.cca2),
    n3: man.n3 || (m && m.ccn3) || null,
    n: man.n || (m && m.name.common),
    es: man.es || (m && m.translations && m.translations.spa && m.translations.spa.common) || (m && m.name.common),
    region: man.region || (wb && wb.region && wb.region.value.trim()) || (m && m.region) || '',
    inc: man.inc || (wb && INC[wb.incomeLevel.value]) || null,
    cur,
    est: [],
  };
  return c;
});
const byId = Object.fromEntries(countries.map((c) => [c.id, c]));

// ---------- fill each country ----------
const need = (id, key) => (W[key][id] ? W[key][id].v : null);

for (const c of countries) {
  const id = c.id;
  const p = pip.countries[id];
  c.pop = (p && p.pop) || need(id, 'pop') || MANUAL[id]?.pop || null;
  const pop0014 = need(id, 'pop0014');
  c.adults = c.pop ? Math.round(c.pop * (1 - (pop0014 == null ? 26 : pop0014) / 100)) : null;
  c.gnipc = need(id, 'gnipc');
  c.life = need(id, 'life');
  c.u5 = need(id, 'u5');
  c.oop = need(id, 'oop');
  c.elec = need(id, 'elec');
  c.cook = need(id, 'cooking');
  c.water = need(id, 'water');
  c.waterB = need(id, 'waterBasic');
  c.san = need(id, 'sanitation');
  c.sanB = need(id, 'sanitationBasic');
  c.net = need(id, 'internet');
  c.vuln = need(id, 'vulnerable');
  c.lit = need(id, 'literacy');
  c.hom = need(id, 'homicide');
  c.pv = need(id, 'polStability');
  c.rl = need(id, 'ruleOfLaw');
  c.ge = need(id, 'govEffectiveness');
  c.va = need(id, 'voice');
  c.cc = need(id, 'corruption');
  c.food = need(id, 'foodInsecure');
  c.und = need(id, 'undernourished');
  c.emerg = need(id, 'emergencyFunds'); // % of adults who could raise emergency funds in 30 days (Findex)
  const slum = need(id, 'slums');
  const urban = need(id, 'urban');
  c.slum = slum != null && urban != null ? round((slum * urban) / 100, 1) : null; // % of whole population
  c.att = ['attPrimary', 'attLowerSec', 'attUpperSec', 'attShortTertiary', 'attBachelor', 'attMaster', 'attDoctoral'].map((k) => need(id, k));
}

// HDR 2023 values
const hdrBy = Object.fromEntries(hdr.map((r) => [r.iso3, r]));
for (const c of countries) {
  const r = hdrBy[c.id];
  const num = (k) => (r && r[k] !== '' && r[k] != null && !Number.isNaN(+r[k]) ? +r[k] : null);
  c.hdi = num('hdi_2023');
  c.mys = num('mys_2023');
  c.eys = num('eys_2023');
  if (c.life == null) { const l = num('le_2023'); if (l != null) c.life = l; }
  if (c.gnipc == null) { const g = num('gnipc_2023'); if (g != null) c.gnipc = g; }
}

// WHO UHC service coverage index: latest year per country
const uhcLatest = {};
for (const g of gho) {
  if (g.SpatialDimType !== 'COUNTRY' || g.NumericValue == null) continue;
  const cur = uhcLatest[g.SpatialDim];
  if (!cur || g.TimeDim > cur.y) uhcLatest[g.SpatialDim] = { v: g.NumericValue, y: g.TimeDim };
}
for (const c of countries) c.uhc = uhcLatest[c.id] ? uhcLatest[c.id].v : null;

// ---------- fill gaps with income-group medians ----------
const groups = {};
for (const c of countries) (groups[c.inc || '?'] ||= []).push(c);
function fillGroup(field, { derive } = {}) {
  const medians = {};
  for (const [g, list] of Object.entries(groups)) medians[g] = median(list.map((c) => c[field]));
  const overall = median(countries.map((c) => c[field]));
  for (const c of countries) {
    if (c[field] != null) continue;
    let v = derive ? derive(c, medians) : null;
    if (v == null) v = medians[c.inc || '?'] ?? overall;
    c[field] = v;
    c.est.push(field);
  }
}
// safely managed water/sanitation: derive from the basic level when we have it
for (const f of [['water', 'waterB'], ['san', 'sanB']]) {
  const ratio = {};
  for (const [g, list] of Object.entries(groups)) {
    ratio[g] = median(list.filter((c) => c[f[0]] != null && c[f[1]] != null && c[f[1]] > 0).map((c) => c[f[0]] / c[f[1]]));
  }
  fillGroup(f[0], { derive: (c) => (c[f[1]] != null ? Math.min(100, c[f[1]] * (ratio[c.inc || '?'] || 0.8)) : null) });
}
for (const f of ['life', 'u5', 'oop', 'elec', 'cook', 'net', 'vuln', 'lit', 'hom', 'pv', 'rl', 'ge', 'va', 'cc', 'food', 'und', 'uhc', 'slum', 'gnipc', 'hdi', 'mys', 'eys', 'emerg']) fillGroup(f);
for (const c of countries) {
  for (const f of ['elec', 'cook', 'water', 'san', 'net', 'food', 'und', 'slum', 'lit', 'uhc', 'emerg']) c[f] = Math.max(0, Math.min(100, c[f]));
}

// ---------- educational attainment: fill gaps from mean years of schooling ----------
// Cumulative shares of adults 25+ who completed at least: primary, lower secondary, upper
// secondary, short-cycle tertiary, bachelor's, master's, doctorate. Fit a logit line on mean
// years of schooling (UNDP) for each level and use it where a country has no survey value.
{
  const logit = (p) => Math.log(p / (1 - p));
  const inv = (x) => 1 / (1 + Math.exp(-x));
  for (let k = 0; k < 7; k++) {
    const pts = countries.filter((c) => c.att[k] != null && c.mys != null && c.att[k] > 0.05 && c.att[k] < 99.95).map((c) => [c.mys, logit(c.att[k] / 100)]);
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const my = pts.reduce((s, p) => s + p[1], 0) / n;
    const b = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    const a = my - b * mx;
    for (const c of countries) {
      if (c.att[k] == null) { c.att[k] = round(100 * inv(a + b * c.mys), 1); if (!c.est.includes('att')) c.est.push('att'); }
    }
  }
  for (const c of countries) {
    // make the levels non-increasing and keep each in [0, 100]
    for (let k = 0; k < 7; k++) {
      c.att[k] = Math.max(0, Math.min(100, c.att[k]));
      if (k > 0) c.att[k] = Math.min(c.att[k], c.att[k - 1]);
    }
    c.att = c.att.map((x) => round(x, 1));
  }
}

// ---------- money: PPP factor, prices, exchange rate ----------
// ppp21: local currency units per international dollar (2021, private consumption).
// priceRatio: consumer price index now vs 2021, extrapolated at run time with `pi`.
const plrByGroup = {};
for (const [g, list] of Object.entries(groups)) {
  plrByGroup[g] = median(list.map((c) => { const p = need(c.id, 'pppPrivate2021'); const f = fx2021[c.id]; return p && f ? p / f : null; }));
}
for (const c of countries) {
  const id = c.id;
  // exchange rate: today's snapshot, falling back to the 2025 World Bank average
  const rate = c.cur === 'USD' ? 1 : fx.rates[c.cur] || (fx2025[id] ? fx2025[id].v : null);
  c.fx = rate ? +rate.toPrecision(6) : null;
  let ppp = need(id, 'pppPrivate2021') ?? need(id, 'pppGdp2021');
  if (ppp == null) {
    const base = fx2021[id] ?? (fx2025[id] ? fx2025[id].v : rate);
    ppp = base ? (plrByGroup[c.inc || '?'] || 0.5) * base : null;
    c.est.push('ppp');
  }
  c.ppp = ppp ? +Number(ppp).toPrecision(6) : null;
  const cpiNow = W.cpi[id];
  const c21 = cpi2021[id];
  const infl = W.inflation[id];
  // cpiR: consumer prices now versus the 2021 average. cpiT: when "now" is, as a decimal year
  // (annual averages sit in the middle of the year). pi: yearly inflation used to move on from cpiT.
  if (cpiNow && c21 && cpiNow.y >= 2023) { c.cpiR = +(cpiNow.v / c21).toPrecision(5); c.cpiT = cpiNow.y + 0.5; }
  else { c.cpiR = null; c.cpiT = null; }
  c.pi = infl && infl.y >= 2023 ? +(Math.max(-0.05, Math.min(0.6, infl.v / 100))).toFixed(4) : null;
}
// Gaps in prices: use the group's median yearly inflation since 2021.
{
  const rateOf = (c) => (c.cpiR ? Math.pow(c.cpiR, 1 / (c.cpiT - 2021.5)) - 1 : null);
  for (const [g, list] of Object.entries(groups)) {
    const r = median(list.map(rateOf));
    const p = median(list.map((c) => c.pi));
    for (const c of list) {
      if (c.cpiR == null) { c.cpiT = 2025.5; c.cpiR = +Math.pow(1 + (r ?? 0.05), 2025.5 - 2021.5).toPrecision(5); c.est.push('cpi'); }
      if (c.pi == null) { c.pi = +(p ?? 0.04).toFixed(4); if (!c.est.includes('cpi')) c.est.push('cpi'); }
    }
  }
}
// Argentina: the World Bank has no recent price index, so use INDEC's own monthly series.
{
  const arg = await maybeJSON('data-raw/misc/arg-cpi.json');
  const c = byId.ARG;
  if (arg && c) {
    const rows = arg.data.filter((r) => r[1] != null);
    const y21 = rows.filter((r) => r[0].startsWith('2021')).map((r) => r[1]);
    const avg21 = y21.reduce((s, v) => s + v, 0) / y21.length;
    const last = rows[rows.length - 1];
    const [ly, lm] = [+last[0].slice(0, 4), +last[0].slice(5, 7)];
    const yago = rows.find((r) => r[0].startsWith(`${ly - 1}-${String(lm).padStart(2, '0')}`));
    c.cpiR = +(last[1] / avg21).toPrecision(5);
    c.cpiT = +(ly + (lm - 0.5) / 12).toFixed(3);
    c.pi = +(last[1] / yago[1] - 1).toFixed(4);
    c.est = c.est.filter((f) => f !== 'cpi');
    console.log(`Argentina prices: ${last[0]} is ${c.cpiR}x the 2021 average, ${(c.pi * 100).toFixed(1)}% over twelve months`);
  }
}

// ---------- income distribution ----------
// Real PIP curves where they exist; a log-normal stand-in for the rest (flagged `syn`).
const Z = pip.z;
for (const c of countries) {
  const p = pip.countries[c.id];
  if (p && p.F.length === Z.length && p.F.every((x) => x >= 0)) {
    c.F = p.F.map((x) => Math.round(x * 10000));
    c.med = round(p.median, 2);
    c.mean = round(p.mean, 2);
    c.lvl = p.level === 'national' ? 'n' : p.level[0];
  } else {
    // stand-in: median from the group's ratio of PIP median to GNI per capita
    const ratios = (groups[c.inc || '?'] || []).filter((x) => pip.countries[x.id] && x.gnipc).map((x) => pip.countries[x.id].median / (x.gnipc / 365));
    const med = (median(ratios) || 0.5) * ((c.gnipc || 30000) / 365);
    const sigma = 0.85;
    c.F = Z.map((z) => Math.round(Phi((Math.log(z) - Math.log(med)) / sigma) * 10000));
    c.med = round(med, 2);
    c.mean = round(med * Math.exp((sigma * sigma) / 2), 2);
    c.syn = 1;
    c.lvl = 's';
  }
}

// ---------- wealth (UBS Global Wealth Report 2026) ----------
// UBS prints mean and median wealth per adult for 30 countries. For the rest we fit
// ln(median wealth) against ln(income per person) through those countries plus four older
// low-income points, then give each country a log-normal shape. The result is checked against the
// UBS wealth pyramid in the report printed below.
const WEALTH_ZERO_SHARE = 0.08; // adults with zero or negative net worth: an assumption, UBS does not publish it
if (wealthCurated) {
  const known = wealthCurated.countries;
  const older = wealthCurated.older || {};
  const both = Object.values(known).filter((w) => w.mean && w.median);
  const ratio = median(both.map((w) => w.median / w.mean));
  const pts = [];
  for (const c of countries) {
    const w = known[c.id] && known[c.id].median ? known[c.id] : older[c.id];
    if (w && w.median && c.gnipc) pts.push([Math.log(c.gnipc), Math.log(w.median)]);
  }
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const slope = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  const icpt = my - slope * mx;
  for (const c of countries) {
    const w = known[c.id];
    if (w && (w.mean || w.median)) {
      c.wm = Math.round(w.median ?? w.mean * ratio);
      c.wa = Math.round(w.mean ?? w.median / ratio);
      c.wsrc = w.mean && w.median ? 'ubs' : 'ubs-partial';
    } else if (older[c.id]) {
      // the last UBS values we could find (end of 2022): better than a guess from income
      c.wm = older[c.id].median;
      c.wa = older[c.id].mean;
      c.wsrc = 'ubs2022';
    } else {
      const med = Math.exp(icpt + slope * Math.log(c.gnipc));
      const sigma = c.inc === 'H' ? 1.35 : 1.7;
      c.wm = Math.round(med);
      c.wa = Math.round(med * Math.exp((sigma * sigma) / 2));
      c.wsrc = 'est';
    }
  }
  // Calibration. UBS's pyramid covers 56 markets with 3.85 billion of the world's 5.6 billion
  // adults. The markets left out are mostly poor, and UBS says the 56 hold over 92% of world
  // wealth. Assume the 1.75 billion adults outside the sample nearly all have under $10,000, and the
  // world shares become: under 10k about 59%, 10k to 100k about 29%, 100k to 1m about 10.5%, over
  // 1m about 1.04%. Two knobs bring the model onto those shares: lambda scales the estimated
  // medians (not the UBS ones), kappa narrows every country's spread.
  const adultsAll = countries.reduce((s, c) => s + c.adults, 0);
  const sigmaOf = (c) => Math.max(0.9, Math.min(2.6, Math.sqrt(2 * Math.log(Math.max(c.wa, c.wm * 1.15) / c.wm))));
  const model = (lambda, kappa) => {
    const edges = [0, 1e4, 1e5, 1e6, 1e13];
    const out = [0, 0, 0, 0];
    for (const c of countries) {
      const med = c.wsrc === 'est' ? c.wm * lambda : c.wm;
      const sg = Math.max(0.8, sigmaOf(c) * kappa);
      const cdfAt = (w) => (w <= 0 ? 0 : WEALTH_ZERO_SHARE + (1 - WEALTH_ZERO_SHARE) * Phi((Math.log(w) - Math.log(med)) / sg));
      for (let k = 0; k < 4; k++) out[k] += (c.adults / adultsAll) * (cdfAt(edges[k + 1]) - cdfAt(edges[k]));
    }
    return out;
  };
  const TARGET = [0.593, 0.291, 0.105, 0.0104];
  let best = { err: Infinity };
  for (let lambda = 0.5; lambda <= 1.0001; lambda += 0.05) {
    for (let kappa = 0.78; kappa <= 1.0001; kappa += 0.02) {
      const s = model(lambda, kappa);
      const err = s.reduce((e, v, k) => e + ((v - TARGET[k]) / Math.max(TARGET[k], 0.02)) ** 2, 0);
      if (err < best.err) best = { err, lambda, kappa, s };
    }
  }
  for (const c of countries) {
    if (c.wsrc === 'est') c.wm = Math.round(c.wm * best.lambda);
    const sg = Math.max(0.8, sigmaOf({ ...c, wa: c.wsrc === 'est' ? c.wm * Math.exp((sigmaOf(c) ** 2) / 2) : c.wa }) * best.kappa);
    c.ws = +sg.toFixed(3);
    if (c.wsrc === 'est') c.wa = Math.round(c.wm * Math.exp((sg * sg) / 2));
  }
  wealthDiag = {
    fit: { slope: +slope.toFixed(3), intercept: +icpt.toFixed(3), n: pts.length, ratio: +ratio.toFixed(3), lambda: +best.lambda.toFixed(2), kappa: +best.kappa.toFixed(2) },
    below10k: best.s[0], b10to100k: best.s[1], b100kto1m: best.s[2], above1m: best.s[3],
  };
}
var wealthDiag;

// ---------- passports ----------
const CODE = { '-1': '0', 'visa free': '1', 'visa on arrival': '2', eta: '3', 'e-visa': '4', 'visa required': '5', 'no admission': '6' };
const passports = { ids, legend: ['self', 'visa free', 'visa on arrival', 'eta', 'e-visa', 'visa required', 'no admission'], rows: {}, days: {} };
for (const id of ids) {
  const cells = rowsByPassport[id];
  let codes = '';
  let days = '';
  for (const v of cells) {
    if (/^\d+$/.test(v) && v !== '-1') {
      const d = +v;
      codes += '1';
      days += Math.min(35, Math.max(1, Math.round(d / 10))).toString(36);
    } else {
      const k = CODE[v];
      if (k == null) throw new Error(`Unknown passport value "${v}" for ${id}`);
      codes += k;
      days += '0';
    }
  }
  passports.rows[id] = codes;
  passports.days[id] = days;
}

// ---------- write ----------
const meta = {
  built: new Date().toISOString().slice(0, 10),
  pipYear: pip.year,
  pipPop: pip.worldPop,
  pipMean: pip.worldMean,
  fxDate: fx.time_last_update_utc,
  fxBase: 'USD',
  eurPerUsd: fx.rates.EUR,
  cpiBaseYear: 2021,
  // median 2021 price level of each World Bank income group (PPP rate over market rate),
  // used when a country has no usable price data
  plr: Object.fromEntries(Object.entries(plrByGroup).filter(([, v]) => v).map(([k, v]) => [k, +v.toFixed(4)])),
  pipVersion: pip.version || null,
  wealthZeroShare: WEALTH_ZERO_SHARE,
  // Share of the population covered by at least one social protection benefit, 2023, by World Bank
  // income group (ILO World Social Protection Report 2024-26), and the share of adults who say they
  // have someone to count on (Gallup World Poll, national averages of about 0.81 to 0.85 in 2006 and
  // 2007 data; rough).
  safetyPriors: { state: { H: 0.859, UM: 0.712, LM: 0.324, L: 0.097 }, people: 0.82 },
};
const trim = (c) => {
  const o = { ...c };
  if (!o.est.length) delete o.est;
  for (const k of Object.keys(o)) if (o[k] == null) delete o[k];
  return o;
};
// world history for the "born into a better world" chart
const history = {};
{
  const ts = await json(`data-raw/pip/${PIP_YEAR}/world_ts_3.json`);
  history.poverty = ts.map((r) => [r.reporting_year, +r.headcount, r.estimate_type === 'nowcast' ? 1 : 0]);
  for (const [key, file] of [['life', 'world_life'], ['u5', 'world_u5']]) {
    const j = await json(`data-raw/wdi/${file}.json`);
    history[key] = (j[1] || []).filter((r) => r.value != null).map((r) => [+r.date, +(+r.value).toFixed(1)]).sort((a, b) => a[0] - b[0]);
  }
}
const data = {
  meta,
  history,
  z: Z,
  worldF: pip.world.map((x) => Math.round(x * 10000)),
  countries: countries.sort((a, b) => a.n.localeCompare(b.n)).map(trim),
  blocs: blocs || [],
};
await mkdir('assets/js/data', { recursive: true });
await writeFile('assets/js/data/world.js', `/* Generated by scripts/build-data.mjs on ${meta.built}. Do not edit by hand. */\nwindow.HLIA = window.HLIA || {};\nHLIA.DATA = ${JSON.stringify(data)};\n`);
await writeFile('assets/js/data/passports.js', `/* Generated by scripts/build-data.mjs on ${meta.built}. Do not edit by hand. */\nwindow.HLIA = window.HLIA || {};\nHLIA.PASSPORTS = ${JSON.stringify(passports)};\n`);

// ---------- report ----------
const estCount = {};
countries.forEach((c) => (c.est || []).forEach((f) => (estCount[f] = (estCount[f] || 0) + 1)));
const popSum = countries.reduce((s, c) => s + c.pop, 0);
console.log('countries', countries.length, 'population covered', (popSum / 1e9).toFixed(3), 'bn of', (pip.worldPop / 1e9).toFixed(3));
if (wealthDiag) {
  console.log('wealth fit', JSON.stringify(wealthDiag.fit));
  console.log('wealth pyramid after calibration (all adults; target from UBS pyramid and the 5.6bn adults in WIR 2026):',
    `<10k ${(wealthDiag.below10k * 100).toFixed(1)}% (59.3)`, `10k-100k ${(wealthDiag.b10to100k * 100).toFixed(1)}% (29.1)`,
    `100k-1m ${(wealthDiag.b100kto1m * 100).toFixed(1)}% (10.5)`, `>1m ${(wealthDiag.above1m * 100).toFixed(2)}% (1.04)`);
}
console.log('synthetic income curves:', countries.filter((c) => c.syn).map((c) => c.id).join(' ') || 'none');
console.log('urban-only income curves:', countries.filter((c) => c.lvl === 'u').map((c) => c.id).join(' ') || 'none');
console.log('imputed fields (country count):', JSON.stringify(estCount));
console.log('missing income group:', countries.filter((c) => !c.inc).map((c) => c.id).join(' ') || 'none');
for (const id of ['ARG', 'DEU', 'USA', 'IND', 'NGA', 'BRA', 'XKX', 'VAT']) {
  const c = byId[id];
  console.log(id, JSON.stringify({ pop: c.pop, cur: c.cur, fx: c.fx, ppp: c.ppp, cpiR: c.cpiR, cpiT: c.cpiT, pi: c.pi, med: c.med, uhc: c.uhc, life: c.life, att: c.att, hdi: c.hdi, mys: c.mys, est: c.est }));
}
const sizeKB = (s) => (s.length / 1024).toFixed(0) + ' KB';
console.log('world.js', sizeKB(JSON.stringify(data)), 'passports.js', sizeKB(JSON.stringify(passports)));
