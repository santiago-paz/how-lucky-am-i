/* The model: turns a person's answers into a position among everyone alive.

   Every area gives a percentile between 0 and 1: the share of humanity that is behind you
   (people with less, counting half of any tie). The eight areas are then combined into one
   overall percentile. Nothing here touches the page, so the same file runs in Node for tests.

   Data comes from window.HLIA.DATA (built by scripts/build-data.mjs) and HLIA.PASSPORTS. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { Phi, PhiInv, clamp, sum } = HLIA.util;
  const D = HLIA.DATA;
  const P = HLIA.PASSPORTS;

  // ---------- assumptions you can change in one place ----------
  const params = {
    // Assumed correlation between the eight areas when they are combined into one number.
    // Income, health, schooling and governance move together across countries (country-level
    // correlations are above 0.8), and less so within a country, so we take 0.6.
    rho: 0.6,
    // Spread of people around their country's score for scores published only per country.
    spread: { health: 12, stability: 8 },
    // Health: weight of the country's service-coverage index versus the person's own cover.
    healthOwnWeight: 0.5,
    healthOwn: { none: 10, basic: 52, high: 90 },
    // Stability: points taken off the country score by legal status.
    statusPenalty: { citizen: 0, permanent: 4, temporary: 12, insecure: 30 },
    // Mobility: weight of passport power versus means to travel.
    mobilityPassportWeight: 0.75,
    mobilityCorrelation: 0.5,
    // Share of humanity that takes a flight in a year (proxy for "can afford to travel").
    travelShare: 0.11,
    // Weights of the eight areas in the overall number (all equal).
    weights: { income: 1, wealth: 1, mobility: 1, health: 1, education: 1, basics: 1, safety: 1, stability: 1 },
    // Plausible error band on the income estimate (prices and exchange rates are never exact).
    incomeBand: [0.8, 1.25],
  };

  // ---------- indexes ----------
  const countries = D.countries;
  const byId = Object.fromEntries(countries.map((c) => [c.id, c]));
  const totalPop = sum(countries.map((c) => c.pop));
  const totalAdults = sum(countries.map((c) => c.adults));
  const wPop = (c) => c.pop / totalPop;
  const wAdult = (c) => c.adults / totalAdults;
  const worldPop = D.meta.pipPop;

  // ---------- income distribution: exact survey curves from the World Bank ----------
  const Z = D.z;
  const LZ = Z.map(Math.log);
  const K = Z.length;
  const WF = D.worldF;
  const ZMAX_TAIL_ALPHA = 2.2; // Pareto index used only beyond the highest line ($1,000 a day)

  // Share of people living on less than z dollars a day (2021 PPP), interpolated in log z.
  function cdf(F, z) {
    const t = Math.log(Math.max(z, 1e-6));
    if (t <= LZ[0]) return (F[0] / 10000) * Math.exp(t - LZ[0]);
    if (t >= LZ[K - 1]) {
      const s = 1 - F[K - 1] / 10000;
      return 1 - s * Math.pow(Math.exp(t - LZ[K - 1]), -ZMAX_TAIL_ALPHA);
    }
    let lo = 0, hi = K - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (LZ[m] <= t) lo = m; else hi = m; }
    const u = (t - LZ[lo]) / (LZ[hi] - LZ[lo]);
    return (F[lo] + u * (F[hi] - F[lo])) / 10000;
  }
  // Inverse: the daily income that p of the people live below.
  function quantile(F, p) {
    if (p <= F[0] / 10000) return Z[0];
    if (p >= F[K - 1] / 10000) return Z[K - 1];
    let lo = 0, hi = K - 1;
    const target = p * 10000;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F[m] <= target) lo = m; else hi = m; }
    const span = F[hi] - F[lo];
    const u = span > 0 ? (target - F[lo]) / span : 0;
    return Math.exp(LZ[lo] + u * (LZ[hi] - LZ[lo]));
  }
  // Average global percentile of the people living in a country (used for the "typical person").
  function avgGlobalPct(c) {
    if (c._avgG != null) return c._avgG;
    let prev = 0, prevG = 0, acc = 0;
    for (let k = 0; k < K; k++) {
      const f = c.F[k] / 10000, g = WF[k] / 10000;
      acc += (f - prev) * ((prevG + g) / 2);
      prev = f; prevG = g;
    }
    acc += (1 - prev) * ((prevG + 1) / 2);
    return (c._avgG = acc);
  }

  // ---------- prices and money ----------
  function nowT(date = new Date()) {
    const y = date.getUTCFullYear();
    return y + (date - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
  }
  // Consumer prices at time t compared with the 2021 average, moving on from the last reading.
  const priceFactor = (c, t) => c.cpiR * Math.pow(1 + c.pi, Math.max(0, t - c.cpiT));
  const roughPrices = (c) => !!(c.est && (c.est.includes('cpi') || c.est.includes('ppp')));

  // Turn a monthly amount into 2021 international dollars (PPP) per month.
  //   LOCAL: local currency, deflated with the country's own prices and its 2021 PPP rate.
  //   USD or EUR: converted at today's exchange rate first.
  // Where the price data is rough we go through US dollars and the group's price level instead.
  function toPPPMonth(c, amount, currency, t = nowT()) {
    // North Korea has no published exchange rate, so its "local" amounts are read as US dollars
    const cur = currency === 'LOCAL' && !c.fx ? 'USD' : currency;
    const fx = c.fx || 1;
    let usd, lcu;
    if (cur === 'LOCAL') { lcu = amount; usd = amount / fx; }
    else { usd = cur === 'EUR' ? amount / D.meta.eurPerUsd : amount; lcu = usd * fx; }
    const ppp = roughPrices(c)
      ? usd / priceFactor(byId.USA, t) / (D.meta.plr[c.inc] || 0.5)
      : lcu / (c.ppp * priceFactor(c, t));
    return { lcu, usd, ppp };
  }

  // ---------- helpers for combining ----------
  // Combine standard-normal scores that share a pairwise correlation into one standard-normal score.
  function combineZ(zs, ws, rho) {
    const w = ws || zs.map(() => 1);
    const sw = sum(w);
    const sw2 = sum(w.map((x) => x * x));
    const denom = Math.sqrt((1 - rho) * sw2 + rho * sw * sw);
    return sum(zs.map((z, i) => w[i] * z)) / denom;
  }
  const zOf = (p) => PhiInv(clamp(p, 0.0005, 0.9995));

  // ---------- 1. income ----------
  function perCapita(a) {
    const inc = a.income || {};
    const toMonth = (x) => (inc.period === 'year' ? x / 12 : x);
    const hh = a.household;
    const shared = !!(hh && hh.shared);
    const people = shared ? Math.max(1, (hh.adults || 1) + (hh.children || 0)) : 1;
    const total = shared && hh.total > 0 ? toMonth(hh.total) : toMonth(inc.amount || 0);
    return { people, total, perPerson: total / people };
  }
  function income(a) {
    const c = byId[a.residence];
    const pc = perCapita(a);
    const conv = toPPPMonth(c, pc.perPerson, a.income.currency);
    const z = (conv.ppp * 12) / 365.25;
    const [bLo, bHi] = params.incomeBand;
    return {
      id: 'income', z, usdMonth: conv.usd, pppMonth: conv.ppp, people: pc.people, householdMonth: pc.total,
      global: cdf(WF, z), local: cdf(c.F, z),
      range: [cdf(WF, z * bLo), cdf(WF, z * bHi)],
      localRange: [cdf(c.F, z * bLo), cdf(c.F, z * bHi)],
      typical: avgGlobalPct(c),
    };
  }

  // ---------- 2. wealth ----------
  // Net worth per adult, modelled per country as a log-normal that matches the published median
  // and mean, plus a share of adults with nothing or less than nothing.
  const wealthCache = new Map();
  function wealthParams(c) {
    if (wealthCache.has(c.id)) return wealthCache.get(c.id);
    const med = Math.max(c.wm || 1000, 50);
    const mean = Math.max(c.wa || med * 2, med * 1.15);
    const sigma = c.ws || clamp(Math.sqrt(2 * Math.log(mean / med)), 0.9, 2.6);
    const p0 = c.wz != null ? c.wz : D.meta.wealthZeroShare != null ? D.meta.wealthZeroShare : 0.1;
    const out = { mu: Math.log(med), sigma, p0 };
    wealthCache.set(c.id, out);
    return out;
  }
  // Share of adults in country c with net worth below w (US dollars at market rates).
  function wealthCdf(c, w) {
    const { mu, sigma, p0 } = wealthParams(c);
    if (w <= 0) return p0 * 0.5;
    return p0 + (1 - p0) * Phi((Math.log(w) - mu) / sigma);
  }
  function wealthWorldCdf(w) {
    let s = 0;
    for (const c of countries) s += wAdult(c) * wealthCdf(c, w);
    return s;
  }
  function worldWealthQuantile(p) {
    let lo = 1, hi = 5e7;
    for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (wealthWorldCdf(m) < p) lo = m; else hi = m; }
    return Math.sqrt(lo * hi);
  }
  // The form asks for a bracket, not a number. Each bracket stands for a typical value inside it
  // (roughly the middle on a log scale).
  const NET_WORTH_BRACKET = { neg: -5000, b0: 3000, b1: 30000, b2: 300000, b3: 2000000 };
  function netWorthUSD(a) {
    const nw = a.netWorth;
    if (!nw || nw.skip || !nw.bracket) return null;
    return NET_WORTH_BRACKET[nw.bracket] ?? null;
  }
  // Without a stated net worth, guess it from the savings buffer, housing and income.
  function estimateNetWorth(a, inc) {
    const monthlySpend = Math.max(inc.usdMonth * 0.7, 30);
    const months = { none: 0, lt3: 1.5, '3to6': 4.5, gt6: 10, gt24: 30 }[a.savings] ?? 2;
    let w = months * monthlySpend;
    const c = byId[a.residence];
    // value of a home, rough: 3 years of the country's median household income times 3
    const homeValue = 6 * 12 * Math.max((c.med || 5) * 365.25 / 12 * 1.0 * (c.fx ? 1 : 1), 200);
    if (a.tenure === 'own') w += homeValue;
    else if (a.tenure === 'mortgage') w += homeValue * 0.25;
    return w;
  }
  function wealth(a, inc) {
    const c = byId[a.residence];
    let w = netWorthUSD(a);
    let estimated = false;
    if (w == null) { w = estimateNetWorth(a, inc); estimated = true; }
    return {
      id: 'wealth', usd: w, estimated,
      global: wealthWorldCdf(w), local: wealthCdf(c, w),
      typical: wealthWorldCdf(wealthParams(c).p0 > 0 ? Math.exp(wealthParams(c).mu) : 1000),
    };
  }

  // ---------- 3. mobility ----------
  const PIDS = P.ids;
  const NP = PIDS.length;
  const pIndex = Object.fromEntries(PIDS.map((id, i) => [id, i]));
  const rowCode = (id, j) => P.rows[id].charCodeAt(j) - 48; // 0 self, 1 visa free, 2 on arrival, 3 eta, 4 e-visa, 5 required, 6 no admission
  const reach = {};
  PIDS.forEach((id) => { let n = 0; for (let j = 0; j < NP; j++) { const k = rowCode(id, j); if (k >= 1 && k <= 3) n++; } reach[id] = n; });
  const ranked = PIDS.slice().sort((x, y) => reach[y] - reach[x]);
  const vList = PIDS.map((id) => ({ v: reach[id], w: byId[id] ? byId[id].pop : 0 }));
  const vTotal = sum(vList.map((x) => x.w));
  function reachPct(v) {
    let below = 0, tie = 0;
    for (const x of vList) { if (x.v < v) below += x.w; else if (x.v === v) tie += x.w; }
    return (below + 0.5 * tie) / vTotal;
  }
  // Rights to live and work, from treaties (see data/curated/blocs.json).
  // Returns where the passports give a right to live and work: `live` (no permit needed) and
  // `limited` (a residence route, or some jobs only). Each regime lists who holds the right
  // (`from`, or all `members`) and where it applies (`to`, or all `members`, plus any `interim`).
  function rightsFor(passports) {
    const live = new Set(), limited = new Set();
    for (const b of D.blocs || []) {
      const holders = b.from || b.members;
      const interim = b.interim || [];
      const holds = passports.some((id) => holders.includes(id));
      const holdsInterim = passports.some((id) => interim.includes(id));
      if (!holds && !holdsInterim) continue;
      const places = b.to || b.members;
      for (const m of places) (b.rights === 'full' && holds ? live : limited).add(m);
      for (const m of interim) limited.add(m);
    }
    passports.forEach((id) => live.add(id));
    for (const m of live) limited.delete(m);
    return { live, limited };
  }
  function travelPct(can) {
    const s = params.travelShare;
    return can ? 1 - 0.5 * s : 0.5 * (1 - s);
  }
  function mobility(a) {
    const mine = (a.passports || []).filter((id) => P.rows[id]);
    const best = new Uint8Array(NP).fill(9);
    for (const id of mine) for (let j = 0; j < NP; j++) { const k = rowCode(id, j); if (k < best[j]) best[j] = k; }
    const homes = new Set(mine);
    let v = 0;
    for (let j = 0; j < NP; j++) if (!homes.has(PIDS[j]) && best[j] >= 1 && best[j] <= 3) v++;
    const reachShare = reachPct(v);
    const rights = rightsFor(mine);
    const zp = zOf(reachShare);
    const zt = zOf(travelPct(!!a.travel));
    const wp = params.mobilityPassportWeight;
    const z = combineZ([zp, zt], [wp, 1 - wp], params.mobilityCorrelation);
    const home = byId[a.residence];
    const typicalV = P.rows[a.residence] ? reach[a.residence] : v;
    return {
      id: 'mobility', best, homes, reach: v, outOf: NP - mine.length,
      rank: ranked.findIndex((id) => reach[id] <= v) + 1,
      passportPct: reachShare, global: Phi(z), local: null,
      live: rights.live, limited: rights.limited,
      typical: reachPct(typicalV), // the typical resident holds the local passport
      home,
    };
  }

  // ---------- 4. health ----------
  function healthWorldCdf(score) {
    let s = 0;
    for (const c of countries) s += wPop(c) * Phi((score - c.uhc) / params.spread.health);
    return s;
  }
  function health(a) {
    const c = byId[a.residence];
    const own = params.healthOwn[a.health] ?? params.healthOwn.basic;
    const w = params.healthOwnWeight;
    const score = (1 - w) * c.uhc + w * own;
    return { id: 'health', score, uhc: c.uhc, global: healthWorldCdf(score), local: null, typical: healthWorldCdf(c.uhc) };
  }

  // ---------- 5. education ----------
  // c.att holds the share (percent) of adults 25+ who completed at least: primary, lower
  // secondary, upper secondary, short tertiary, bachelor, master, doctorate.
  const EDU = ['none', 'primary', 'secondary', 'tertiaryPartial', 'bachelor', 'postgrad'];
  function eduBands(c) {
    const A = c.att.map((x) => x / 100);
    // [share below this level, share at this level]
    return [
      [0, 1 - A[0]],
      [1 - A[0], A[0] - A[1]],
      [1 - A[1], A[1] - A[3]],
      [1 - A[3], A[3] - A[4]],
      [1 - A[4], A[4] - A[5]],
      [1 - A[5], A[5]],
    ];
  }
  const eduPctIn = (c, level) => { const [below, at] = eduBands(c)[level]; return below + 0.5 * at; };
  const eduWorld = EDU.map((_, L) => sum(countries.map((c) => wAdult(c) * eduPctIn(c, L))));
  function education(a) {
    const L = Math.max(0, EDU.indexOf(a.education));
    const c = byId[a.residence];
    // the typical resident: average world percentile over the levels people in the country hold
    const bands = eduBands(c);
    const typical = sum(bands.map(([, at], i) => at * eduWorld[i]));
    return { id: 'education', level: L, global: eduWorld[L], local: eduPctIn(c, L), typical };
  }

  // ---------- 6. home and basics ----------
  // Seven things many people lack. We model how many of them a random person has with a
  // one-factor model: each item is switched on when a shared "how well off is this household"
  // factor, plus noise, clears a threshold set by the country's coverage rate.
  const BASICS = ['water', 'toilet', 'power', 'cooking', 'internet', 'food', 'housing'];
  const basicsRate = (c) => [c.water, c.san, c.elec, c.cook, c.net, 100 - c.food, 100 - c.slum].map((x) => clamp(x / 100, 0.004, 0.996));
  const NODES = (() => { const out = []; for (let i = -16; i <= 16; i++) { const f = i * 0.25; out.push([f, Math.exp(-0.5 * f * f) / Math.sqrt(2 * Math.PI) * 0.25]); } return out; })();
  // Distribution of the number of items held, for a list of coverage rates and item correlation r.
  function countDist(rates, r) {
    const n = rates.length;
    const thr = rates.map((q) => PhiInv(1 - q));
    const out = new Array(n + 1).fill(0);
    const sr = Math.sqrt(r), si = Math.sqrt(1 - r);
    for (const [f, w] of NODES) {
      let dp = new Array(n + 1).fill(0);
      dp[0] = 1;
      for (let i = 0; i < n; i++) {
        const p = Phi((sr * f - thr[i]) / si);
        for (let k = i + 1; k >= 0; k--) dp[k] = dp[k] * (1 - p) + (k > 0 ? dp[k - 1] * p : 0);
      }
      for (let k = 0; k <= n; k++) out[k] += w * dp[k];
    }
    const tot = sum(out);
    return out.map((x) => x / tot);
  }
  const midrank = (dist, k) => { let below = 0; for (let i = 0; i < k; i++) below += dist[i]; return below + 0.5 * dist[k]; };
  // Percentile for a fractional count (blend of the two neighbouring whole counts).
  function midrankFrac(dist, k) {
    const lo = Math.floor(k), hi = Math.ceil(k);
    return lo === hi ? midrank(dist, lo) : midrank(dist, lo) * (hi - k) + midrank(dist, hi) * (k - lo);
  }
  function worldCount(rateFn, r) {
    const out = new Array(rateFn(countries[0]).length + 1).fill(0);
    const per = new Map();
    for (const c of countries) {
      const d = countDist(rateFn(c), r);
      per.set(c.id, d);
      for (let k = 0; k < d.length; k++) out[k] += wPop(c) * d[k];
    }
    return { world: out, per };
  }
  const BASICS_R = 0.6;
  const basicsModel = worldCount(basicsRate, BASICS_R);
  function basics(a) {
    // "housing" comes from the tenure answer when there is one; the other six are tapped by the person
    const have = BASICS.filter((k) => (k === 'housing' && a.tenure ? a.tenure !== 'insecure' : a.basics && a.basics[k]));
    const count = have.length;
    const c = byId[a.residence];
    const local = basicsModel.per.get(c.id);
    const typical = sum(local.map((p, k) => p * midrank(basicsModel.world, k)));
    return { id: 'basics', count, of: BASICS.length, have, global: midrank(basicsModel.world, count), local: midrank(local, count), typical };
  }

  // ---------- 7. safety net ----------
  // Four things that cushion a bad year: a secure income source, support from the state,
  // people who would help, and savings. Coverage rates come from the ILO, Gallup and Global Findex.
  const SAFETY = ['income', 'state', 'people', 'savings'];
  const SAFE = () => D.meta.safetyPriors || { state: { H: 0.86, UM: 0.71, LM: 0.32, L: 0.1 }, people: 0.82 };
  // formal work: vulnerable employment is the closest country series we have for informal work
  // state help: share covered by at least one benefit, by income group (ILO)
  // people: share who say they have someone to count on (Gallup)
  // savings: share who could raise emergency funds within 30 days (Global Findex, per country)
  const safetyRate = (c) => {
    const s = SAFE();
    const formal = clamp(1 - (c.vuln / 100) * 1.15, 0.03, 0.97);
    return [formal, s.state[c.inc] ?? 0.4, s.people, c.emerg / 100].map((x) => clamp(x, 0.004, 0.996));
  };
  const SAFETY_R = 0.5;
  const safetyModel = worldCount(safetyRate, SAFETY_R);
  const WORK_VALUE = { formal: 1, selfstable: 0.6, informal: 0, none: 0.2 };
  const STATE_VALUE = { yes: 1, partly: 0.5, no: 0 };
  // The Findex question is easier than "3 months of costs": it asks about a small emergency sum.
  // Someone with under 3 months of savings almost surely could raise it.
  const SAVINGS_VALUE = { none: 0, lt3: 0.8, '3to6': 1, gt6: 1, gt24: 1 };
  function safety(a) {
    const items = [WORK_VALUE[a.workType] ?? 0.3, STATE_VALUE[a.stateHelp] ?? 0.5, a.support ? 1 : 0, SAVINGS_VALUE[a.savings] ?? 0.3];
    const count = sum(items);
    const c = byId[a.residence];
    const local = safetyModel.per.get(c.id);
    const typical = sum(local.map((p, k) => p * midrank(safetyModel.world, k)));
    return { id: 'safety', items, count, global: midrankFrac(safetyModel.world, count), local: midrankFrac(local, count), typical };
  }

  // ---------- 8. stability and freedom ----------
  const stabilityScore = (c) => (c.pv + c.rl + c.va) / 3;
  function stabilityWorldCdf(score) {
    let s = 0;
    for (const c of countries) s += wPop(c) * Phi((score - stabilityScore(c)) / params.spread.stability);
    return s;
  }
  function stability(a) {
    const c = byId[a.residence];
    const pen = params.statusPenalty[a.status] ?? 0;
    const score = clamp(stabilityScore(c) - pen, 0, 100);
    return { id: 'stability', score, base: stabilityScore(c), global: stabilityWorldCdf(score), local: null, typical: stabilityWorldCdf(stabilityScore(c)) };
  }

  // ---------- put it together ----------
  const DIMENSIONS = [
    { id: 'income', fn: income, data: 'strong' },
    { id: 'wealth', fn: wealth, data: 'good' },
    { id: 'mobility', fn: mobility, data: 'strong' },
    { id: 'health', fn: health, data: 'good' },
    { id: 'education', fn: education, data: 'good' },
    { id: 'basics', fn: basics, data: 'good' },
    { id: 'safety', fn: safety, data: 'rough' },
    { id: 'stability', fn: stability, data: 'good' },
  ];

  function compute(a, opts = {}) {
    const only = opts.only; // array of area ids to include (used while the form is half filled)
    const inc = income(a);
    const dims = [];
    for (const d of DIMENSIONS) {
      if (only && !only.includes(d.id)) continue;
      const r = d.id === 'income' ? inc : d.id === 'wealth' ? wealth(a, inc) : d.fn(a);
      r.data = d.data;
      dims.push(r);
    }
    const ws = dims.map((d) => params.weights[d.id]);
    const zs = dims.map((d) => zOf(d.global));
    const overallZ = combineZ(zs, ws, params.rho);
    const overall = Phi(overallZ);
    const typicalZ = combineZ(dims.map((d) => zOf(d.typical)), ws, params.rho);
    return {
      dims, income: inc,
      overall: { pct: overall, ahead: 1 - overall, behind: overall * worldPop, z: overallZ, typicalPct: Phi(typicalZ) },
    };
  }

  // ---------- world reference numbers for charts ----------
  const markers = {
    extreme: 3.0, lowerMiddle: 4.2, upperMiddle: 8.3,
    median: quantile(WF, 0.5), mean: D.meta.pipMean,
    p10: quantile(WF, 0.1), p25: quantile(WF, 0.25), p75: quantile(WF, 0.75),
    p90: quantile(WF, 0.9), p95: quantile(WF, 0.95), p99: quantile(WF, 0.99), p999: quantile(WF, 0.999),
  };
  // Overall-luck bands for the pyramid (share of humanity per step, lowest step first).
  const BAND_EDGES = [0, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999, 1];
  const bandOf = (pct) => { for (let i = BAND_EDGES.length - 2; i >= 0; i--) if (pct >= BAND_EDGES[i]) return i; return 0; };

  // Picks a random person alive today (used by the birth lottery); uses the dot layout when ready.
  function lifeFacts(c) {
    return { life: c.life, u5: c.u5, uhc: c.uhc, elec: c.elec, water: c.water, net: c.net, mys: c.mys, hdi: c.hdi };
  }

  HLIA.model = {
    params, byId, countries, worldPop, totalPop, Z, WF, K,
    cdf, quantile, avgGlobalPct, nowT, priceFactor, toPPPMonth, perCapita, combineZ, zOf,
    income, wealth, mobility, health, education, basics, safety, stability, compute,
    wealthCdf, wealthWorldCdf, worldWealthQuantile, wealthParams,
    reach, ranked, reachPct, PIDS, pIndex, rowCode, NP, rightsFor,
    EDU, eduWorld, eduBands, BASICS, SAFETY, basicsModel, safetyModel, countDist, midrank,
    markers, BAND_EDGES, bandOf, lifeFacts, DIMENSIONS, healthWorldCdf, stabilityWorldCdf, stabilityScore,
  };
})(window);
