/* The people: about 8,200 dots, each one standing for about a million people.
   Position on the map comes from the build step. Each dot belongs to a country, and gets an income
   from that country's real distribution. A country with 50 million people gets 50 dots whose incomes
   are spread evenly through its curve, so all the dots together reproduce the world distribution. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const M = HLIA.MAP;
  const model = HLIA.model;

  const bytes = (() => {
    const s = atob(M.xy);
    const buf = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
    return new Uint16Array(buf.buffer);
  })();
  const n = bytes.length / 2;
  const mapX = new Float32Array(n);
  const mapY = new Float32Array(n);
  const ci = new Uint8Array(n); // index into M.ids
  const z = new Float32Array(n); // dollars a day (2021 PPP)
  const start = [];
  const random = HLIA.util.rng(20261027);

  let k = 0;
  M.ids.forEach((id, idx) => {
    const c = model.byId[id];
    const cnt = M.counts[idx];
    start[idx] = k;
    const zs = [];
    for (let j = 0; j < cnt; j++) zs.push(model.quantile(c.F, (j + 0.5) / cnt));
    for (let j = cnt - 1; j > 0; j--) { const r = Math.floor(random() * (j + 1)); const t = zs[j]; zs[j] = zs[r]; zs[r] = t; }
    for (let j = 0; j < cnt; j++, k++) {
      mapX[k] = M.vb[0] + bytes[2 * k] / M.scale;
      mapY[k] = M.vb[1] + bytes[2 * k + 1] / M.scale;
      ci[k] = idx;
      z[k] = zs[j];
    }
  });

  // rank 0 is the poorest dot. pct runs from 0 to 1.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => z[a] - z[b]);
  const rank = new Uint16Array(n);
  order.forEach((i, r) => { rank[i] = r; });

  const idIndex = Object.fromEntries(M.ids.map((id, i) => [id, i]));

  // Where to draw the "you" dot on the map: the middle of the country's biggest landmass.
  function anchor(id) {
    if (M.cent[id]) return M.cent[id];
    const i = idIndex[id];
    if (i == null || !M.counts[i]) return null;
    let sx = 0, sy = 0;
    for (let j = start[i]; j < start[i] + M.counts[i]; j++) { sx += mapX[j]; sy += mapY[j]; }
    return [sx / M.counts[i], sy / M.counts[i]];
  }

  // One dot picked at random, weighted by nothing: every dot is a million people.
  function pick(rand = Math.random) { return Math.floor(rand() * n); }

  HLIA.people = {
    n, mapX, mapY, ci, z, rank, order, ids: M.ids, vb: M.vb, start, counts: M.counts, idIndex, anchor, pick,
    pct: (i) => (rank[i] + 0.5) / n,
    country: (i) => model.byId[M.ids[ci[i]]],
    // number of dots with less than z dollars a day
    countBelow(zv) { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (z[order[m]] < zv) lo = m + 1; else hi = m; } return lo; },
  };
})(window);
