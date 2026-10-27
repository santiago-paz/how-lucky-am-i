/* The report, part two: passport map and arcs, basics, birth lottery, time, and what to do next. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el, svg, fmt, clamp, $ } = HLIA.util;
  const ui = HLIA.ui;
  const S = HLIA.state;
  const model = HLIA.model;
  const i18n = HLIA.i18n;
  const t = (k, v) => i18n.t(k, v);
  const R1 = () => HLIA.results;
  const H = () => HLIA.results.helpers;

  // ---------- passport ----------
  const CLASS_COLOR = { home: '#ffc14d', live: '#3fdda8', limited: '#3fdda8', free: '#2dc291', arrival: '#20a07a', evisa: '#167e60', none: '#1b2250' };
  const STATUS_KEY = { 1: 'st.free', 2: 'st.arrival', 3: 'st.eta', 4: 'st.evisa', 5: 'st.required', 6: 'st.none' };

  function passportData(R) {
    const m = R.dims.find((d) => d.id === 'mobility');
    const P = HLIA.PASSPORTS;
    const info = {};
    model.PIDS.forEach((id, j) => {
      const code = m.best[j];
      let cls = 'none';
      if (m.homes.has(id)) cls = 'home';
      else if (m.live.has(id)) cls = 'live';
      else if (m.limited.has(id)) cls = 'limited';
      else if (code === 1) cls = 'free';
      else if (code === 2 || code === 3) cls = 'arrival';
      else if (code === 4) cls = 'evisa';
      // days of visa-free stay: best across the passports that give "visa free"
      let days = 0;
      for (const pid of (S.a.passports || [])) if (P.rows[pid] && P.rows[pid].charCodeAt(j) - 48 === 1) days = Math.max(days, parseInt(P.days[pid][j], 36) * 10);
      info[id] = { cls, code, days };
    });
    return { m, info };
  }
  function statusText(id, info) {
    const x = info[id];
    if (!x) return t('pp.nodata');
    if (x.cls === 'home') return t('st.home');
    if (x.cls === 'live') return t('st.live');
    if (x.cls === 'limited') return t('st.limited');
    if (x.code === 1) return x.days ? t('st.freeDays', { days: x.days }) : t('st.free');
    return t(STATUS_KEY[x.code] || 'st.required');
  }

  function passportSection(R, st) {
    const { m, info } = passportData(R);
    const names = {};
    model.countries.forEach((c) => { names[c.id] = i18n.countryName(c); });
    const home = S.a.residence;
    const live = [...m.live].filter((id) => !m.homes.has(id));
    const lim = [...m.limited];

    // ---- 2D map ----
    const MAP = HLIA.MAP;
    const vb0 = MAP.vb;
    let view = { x: vb0[0], y: vb0[1], w: vb0[2], h: vb0[3] };
    const mapSvg = svg('svg', { viewBox: vb0.join(' '), class: 'map', role: 'img', 'aria-label': t('pp.title') });
    const paths = {};
    const g = svg('g', null);
    for (const [key, d] of MAP.shapes) {
      const known = info[key];
      const p = svg('path', { d, class: 'cn c-' + (known ? known.cls : 'nodata'), 'data-id': key });
      if (known && known.cls === 'limited') p.classList.add('c-limited');
      paths[key] = p; g.appendChild(p);
    }
    mapSvg.appendChild(g);
    // small countries get a dot so they can be seen and touched
    const small = [];
    for (const id of model.PIDS) {
      const pos = MAP.cent[id];
      if (!pos) continue;
      if (!paths[id]) { // no polygon: draw a dot
        const c = svg('circle', { cx: pos[0], cy: pos[1], r: 1.6, class: 'cn c-' + info[id].cls, 'data-id': id });
        paths[id] = c; g.appendChild(c); small.push(c);
      }
    }
    const nameOf = (key) => names[key] || (MAP.terr[key] ? (i18n.lang === 'es' ? MAP.terr[key].es : MAP.terr[key].n) : key);
    const result = el('p', { class: 'pp-result', 'aria-live': 'polite' }, '');
    let selected = null;
    function select(id) {
      if (selected && paths[selected]) paths[selected].classList.remove('sel');
      selected = id;
      if (id && paths[id]) { paths[id].classList.add('sel'); paths[id].parentNode.appendChild(paths[id]); }
      result.replaceChildren(...(id ? [el('b', null, nameOf(id)), ': ', statusText(id, info)] : []));
    }
    mapSvg.addEventListener('pointermove', (e) => {
      const p = e.target.closest && e.target.closest('[data-id]');
      if (!p) { ui.tip.hide(); return; }
      const id = p.dataset.id;
      ui.tip.show([el('strong', null, nameOf(id)), el('div', null, info[id] ? statusText(id, info) : t('pp.nodata'))], e.clientX, e.clientY);
    });
    mapSvg.addEventListener('pointerleave', () => ui.tip.hide());
    mapSvg.addEventListener('click', (e) => { const p = e.target.closest && e.target.closest('[data-id]'); if (p && info[p.dataset.id]) select(p.dataset.id); });
    // zoom and pan
    const apply = () => mapSvg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    const zoom = (k, cx = view.x + view.w / 2, cy = view.y + view.h / 2) => {
      const w = clamp(view.w * k, vb0[2] / 10, vb0[2]), h = w * (vb0[3] / vb0[2]);
      view = { x: clamp(cx - (cx - view.x) * (w / view.w), vb0[0], vb0[0] + vb0[2] - w), y: clamp(cy - (cy - view.y) * (h / view.h), vb0[1], vb0[1] + vb0[3] - h), w, h };
      apply();
    };
    mapSvg.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const r = mapSvg.getBoundingClientRect(); zoom(e.deltaY > 0 ? 1.15 : 0.87, view.x + ((e.clientX - r.left) / r.width) * view.w, view.y + ((e.clientY - r.top) / r.height) * view.h); }, { passive: false });
    let drag = null;
    mapSvg.addEventListener('pointerdown', (e) => { if (view.w < vb0[2] - 1) { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; mapSvg.setPointerCapture(e.pointerId); } });
    mapSvg.addEventListener('pointermove', (e) => { if (!drag) return; const r = mapSvg.getBoundingClientRect(); view.x = clamp(drag.vx - ((e.clientX - drag.x) / r.width) * view.w, vb0[0], vb0[0] + vb0[2] - view.w); view.y = clamp(drag.vy - ((e.clientY - drag.y) / r.height) * view.h, vb0[1], vb0[1] + vb0[3] - view.h); apply(); });
    mapSvg.addEventListener('pointerup', () => { drag = null; });
    const zoomBar = el('div', { class: 'zoombar' },
      el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('pp.zoomIn'), onclick: () => zoom(0.7) }, ui.icon('plus')),
      el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('pp.zoomOut'), onclick: () => zoom(1.4) }, ui.icon('minus')),
      el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('pp.reset'), onclick: () => { view = { x: vb0[0], y: vb0[1], w: vb0[2], h: vb0[3] }; apply(); } }, ui.icon('refresh')));
    const mapHost = el('div', { class: 'pp-map' }, mapSvg, zoomBar);

    // ---- 3D arcs ----
    const globeHost = el('div', { class: 'pp-globe', hidden: true });
    let g3 = null;
    async function showGlobe() {
      const ok = await R1().load3d();
      if (!ok) { view2d(); return; }
      if (!g3) {
        try {
          g3 = new HLIA.Globe3D(globeHost, { reduced: HLIA.util.reducedMotion() });
          const colors = {};
          for (const [id, x] of Object.entries(info)) if (x.cls !== 'none') colors[id] = CLASS_COLOR[x.cls] + (x.cls === 'home' ? '' : 'cc');
          g3.paintLand(colors);
          const list = [];
          for (const id of model.PIDS) { const x = info[id]; if (x.cls === 'home' || x.cls === 'none' || x.cls === 'evisa') continue; list.push({ id, color: x.cls === 'live' || x.cls === 'limited' ? '#ffc14d' : '#35d6a0' }); }
          const ll = g3.G.centLL[home];
          if (ll) await g3.flyTo(ll[0], ll[1] * 0.8, 1400);
          g3.showArcs(home, list);
        } catch (e) { disposeGlobe(); view2d(); } // the browser refused a WebGL context: stay on the flat map
      }
    }
    function disposeGlobe() { if (g3) { g3.dispose(); g3 = null; } }
    const seg = el('div', { class: 'seg', role: 'group' });
    let mode = 'map';
    function view2d() { mode = 'map'; paintSeg(); mapHost.hidden = false; globeHost.hidden = true; disposeGlobe(); legendArcs.hidden = true; }
    function paintSeg() {
      seg.replaceChildren(
        el('button', { type: 'button', 'aria-pressed': String(mode === 'map'), onclick: view2d }, t('pp.view.map')),
        el('button', { type: 'button', 'aria-pressed': String(mode === 'globe'), onclick: async () => { mode = 'globe'; paintSeg(); mapHost.hidden = true; globeHost.hidden = false; legendArcs.hidden = false; await showGlobe(); } }, t('pp.view.globe')));
    }
    const legendArcs = el('p', { class: 'small', hidden: true }, t('pp.arcs'));
    paintSeg();

    // ---- search ----
    const options = model.countries.filter((c) => info[c.id]).map((c) => ({ id: c.id, label: names[c.id], alt: i18n.countryAlt(c) + ' ' + c.iso2 + ' ' + c.id })).sort((a, b) => a.label.localeCompare(b.label, i18n.lang));
    const search = ui.combobox({ id: 'pp-search', options, placeholder: t('pp.search.ph'), label: t('pp.search'), onChange(id) { select(id); } });

    // ---- legend, lists ----
    const legend = el('ul', { class: 'legend legend-map', role: 'list', 'aria-label': t('pp.legend') },
      ...[['home', 'pp.home'], ['live', 'pp.live'], ['limited', 'pp.limited'], ['free', 'pp.free'], ['arrival', 'pp.arrival'], ['evisa', 'pp.evisa'], ['none', 'pp.none']].map(([c, k]) =>
        el('li', null, el('i', { class: 'key key-' + c }), t(k))));
    const chipList = (ids) => el('ul', { class: 'chips-static', role: 'list' }, ...ids.sort((a, b) => (names[a] || a).localeCompare(names[b] || b, i18n.lang)).map((id) => el('li', null, names[id] || id)));
    const rights = el('div', { class: 'pp-rights' },
      live.length || lim.length ? null : el('p', { class: 'small' }, t('pp.noRights')),
      live.length ? el('div', null, el('h3', null, t('pp.list'), ' ', el('span', { class: 'small' }, `(${live.length})`)), chipList(live)) : null,
      lim.length ? el('div', null, el('h3', null, t('pp.listLimited'), ' ', el('span', { class: 'small' }, `(${lim.length})`)), chipList(lim)) : null);

    const tbl = HLIA.results.tableView([t('tbl.area'), t('tbl.value')], model.PIDS.filter((id) => names[id]).sort((a, b) => names[a].localeCompare(names[b], i18n.lang)).map((id) => [names[id], statusText(id, info)]));
    const body = i18n.t('pp.body', { n: m.reach, of: m.outOf, live: live.length });
    const sec = HLIA.results.section('passport', 'pp.title', null, [
      el('div', { class: 'pp-tools' }, seg, el('div', { class: 'pp-search' }, el('label', { for: 'pp-search', class: 'field-label' }, t('pp.search')), search)),
      result, mapHost, globeHost, legendArcs, legend, el('p', { class: 'pp-rank' }, t('pp.rank', { rank: m.rank })), rights, tbl, el('p', { class: 'small' }, t('pp.note')),
    ], { intro: el('p', { class: 'read' }, body), sources: ['passport', 'blocs', 'henley'], wide: true });
    sec.addEventListener('hlia:dispose', disposeGlobe);
    st.disposers = (st.disposers || []).concat(disposeGlobe);
    return sec;
  }

  // ---------- basics ----------
  const BASICS = [
    { k: 'water', lack: 0.26, src: ['jmp'], ico: 'water' }, { k: 'toilet', lack: 0.41, src: ['jmp'], ico: 'toilet' },
    { k: 'power', lack: 0.08, src: ['sdg7'], ico: 'power' }, { k: 'cooking', lack: 0.24, src: ['sdg7'], ico: 'cooking' },
    { k: 'internet', lack: 0.26, src: ['itu'], ico: 'internet' }, { k: 'food', lack: 0.26, src: ['fao'], ico: 'food' },
    { k: 'housing', lack: 0.14, src: ['unhabitat'], ico: 'housing' },
  ];
  const EXTRA = ['school', 'read', 'health', 'work', 'social'];
  function basicsSection(R) {
    const a = S.a;
    const have = (k) => (k === 'housing' ? a.tenure !== 'insecure' : !!(a.basics && a.basics[k]));
    const tiles = BASICS.map((b) => {
      const n = Math.round(b.lack * 100);
      const yes = have(b.k);
      const crowd = el('div', { class: 'crowd crowd-sm', 'aria-hidden': 'true' });
      for (let i = 0; i < 100; i++) crowd.appendChild(el('i', { class: i < n ? 'b' : 'a' }));
      return el('li', { class: 'basic' + (yes ? ' yes' : ' no') },
        el('div', { class: 'basic-head' }, el('span', { class: 'ico' }, ui.icon(b.ico)), el('h3', null, t('b.' + b.k)), HLIA.results.infoFor(b.src)),
        crowd,
        el('p', { class: 'basic-n' }, el('b', null, t('b.lack', { n })), ' ', el('span', { class: 'small' }, t('b.' + b.k + '.d'))),
        el('p', { class: 'basic-you' }, ui.icon(yes ? 'check' : 'minus'), ' ', t(yes ? 'b.have' : 'b.havenot')));
    });
    const count = BASICS.filter((b) => have(b.k)).length;
    const more = el('div', { class: 'basic-more' },
      el('h3', null, t('b.extra'), ' ', HLIA.results.infoFor(['unesco', 'uhcgmr', 'ilo', 'wdi'])),
      el('ul', { class: 'more-facts', role: 'list' }, ...EXTRA.map((k) => el('li', null, el('b', null, t('b.x.' + k + '.n')), el('span', null, t('b.x.' + k + '.d'))))));
    return HLIA.results.section('basics', 'b.title', null, [
      el('ul', { class: 'basics', role: 'list' }, ...tiles),
      el('p', { class: 'basic-sum' }, t('b.sum', { n: count })),
      more,
    ], { introKey: 'b.body', wide: true });
  }

  // ---------- lottery ----------
  const PREMIUM = [['NGA', 14.85], ['HTI', 10.31], ['IND', 6.25], ['PHL', 3.82], ['BRA', 3.76], ['ARG', 2.54], ['MEX', 2.53]];
  function lotterySection(R, st) {
    const P = HLIA.people;
    const inc = R.income;
    const host = el('div', { class: 'lot-globe' });
    const card = el('div', { class: 'lot-card', 'aria-live': 'polite' }, el('p', { class: 'small' }, t('l.idle')));
    const tally = el('p', { class: 'lot-tally' }, '');
    const bar = el('div', { class: 'tally-bar', 'aria-hidden': 'true' }, el('i', { class: 'r' }), el('i', { class: 'p' }));
    let n = 0, better = 0, g3 = null, busy = false;
    const odds = 1 - model.cdf(model.WF, inc.z);
    function paintTally() {
      tally.textContent = n ? t('l.tally', { n, better, worse: n - better }) + ' ' + (n >= 8 ? t('l.tally.hint', { odds: Math.round(odds * 100) }) : '') : '';
      bar.firstChild.style.width = n ? (better / n) * 100 + '%' : '0%';
      bar.lastChild.style.width = n ? ((n - better) / n) * 100 + '%' : '0%';
    }
    function showCard(i) {
      const c = P.country(i), z = P.z[i], richer = z > inc.z;
      const f = (label, value) => el('div', { class: 'fact' }, el('dt', null, label), el('dd', null, value));
      card.replaceChildren(
        el('h3', null, t('l.born', { country: i18n.countryName(c) })),
        el('p', { class: 'lot-income' }, t('l.income', { day: H().day(z) })),
        el('p', { class: 'lot-vs ' + (richer ? 'up' : 'down') }, ui.icon(richer ? 'check' : 'minus'), ' ', t(richer ? 'l.richer' : 'l.poorer')),
        el('dl', { class: 'facts' },
          f(t('l.life'), t('l.years', { n: fmt.dec(c.life, 1) })), f(t('l.u5'), t('l.per1000', { n: fmt.int(c.u5) })),
          f(t('l.elec'), t('l.pct', { n: fmt.int(Math.round(c.elec)) })), f(t('l.water'), t('l.pct', { n: fmt.int(Math.round(c.water)) })), f(t('l.net'), t('l.pct', { n: fmt.int(Math.round(c.net)) }))));
    }
    function record(i) { n++; if (P.z[i] > inc.z) better++; paintTally(); showCard(i); }
    async function spin() {
      if (busy) return; busy = true; btn.disabled = true;
      const i = P.pick();
      if (g3) { const [lon, lat] = g3.dotLonLat(i); await g3.spinTo(lon, lat, { ms: HLIA.util.reducedMotion() ? 0 : 3200, turns: 1 }); }
      record(i); busy = false; btn.disabled = false;
    }
    function spin10() { for (let k = 0; k < 10; k++) record(P.pick()); }
    const btn = el('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: spin }, ui.icon('dice'), ' ', t('l.spin'));
    const btn10 = el('button', { type: 'button', class: 'btn btn-ghost', onclick: spin10 }, t('l.spin10'));
    const reset = el('button', { type: 'button', class: 'btn btn-quiet', onclick() { n = 0; better = 0; paintTally(); card.replaceChildren(el('p', { class: 'small' }, t('l.idle'))); g3 && g3.releasePin(); } }, t('l.reset'));

    // the 3D globe wakes up when the section comes into view
    const io = new IntersectionObserver(async (es) => {
      if (!es[0].isIntersecting || g3) return;
      if (!(await R1().load3d())) { host.hidden = true; return; }
      try {
        g3 = new HLIA.Globe3D(host, { reduced: HLIA.util.reducedMotion() });
        g3.setUser({ z: inc.z, id: S.a.residence }); g3.setWaveInstant();
      } catch (e) { if (g3) g3.dispose(); g3 = null; host.hidden = true; } // no WebGL: the card and the tally still work
    }, { threshold: 0.2 });
    io.observe(host);
    st.disposers = (st.disposers || []).concat(() => { io.disconnect(); if (g3) { g3.dispose(); g3 = null; } });

    // place premium
    const maxX = 15;
    const prem = el('div', { class: 'premium' },
      el('h3', null, t('l.premium'), ' ', HLIA.results.infoFor(['clemens'])),
      el('ul', { role: 'list' }, ...PREMIUM.map(([id, x]) => {
        const c = model.byId[id]; const mine = id === S.a.residence;
        return el('li', { class: mine ? 'mine' : '' }, el('span', { class: 'pn' }, i18n.countryName(c)), el('span', { class: 'pb' }, el('i', { style: { width: (x / maxX) * 100 + '%' } })), el('span', { class: 'pv' }, t('l.premium.x', { x: fmt.dec(x, 1) })));
      })),
      el('p', { class: 'small' }, t('l.premium.note')));
    const fact = el('p', { class: 'read lot-fact' }, t('l.fact'), ' ', HLIA.results.infoFor(['milanovic']));
    return HLIA.results.section('lottery', 'l.title', null, [
      el('div', { class: 'lot-grid' }, host, el('div', { class: 'lot-side' }, el('div', { class: 'lot-actions' }, btn, btn10, reset), card, bar, tally)),
      fact, prem,
    ], { introKey: 'l.body', wide: true });
  }

  // ---------- time ----------
  function timeSection(R) {
    const Hh = HLIA.DATA.history;
    const nowYear = new Date().getFullYear();
    const birth = S.a.birthYear && S.a.birthYear >= 1960 && S.a.birthYear <= nowYear ? S.a.birthYear : 1990;
    let year = birth;
    const series = [
      { key: 'pov', data: Hh.poverty.map((r) => [r[0], r[1] * 100, r[2]]), unit: 't.povUnit', fmt: (v) => fmt.dec(v, v < 10 ? 1 : 0) + '%', color: 'var(--series-1)' },
      { key: 'life', data: Hh.life, unit: 't.lifeUnit', fmt: (v) => fmt.dec(v, 1), color: 'var(--series-2)' },
      { key: 'u5', data: Hh.u5, unit: 't.u5Unit', fmt: (v) => fmt.int(Math.round(v)), color: 'var(--accent)' },
    ];
    const at = (s, y) => { const d = s.data; if (y < d[0][0] || y > d[d.length - 1][0]) return null; const r = d.find((p) => p[0] === y) || d.reduce((b, p) => (Math.abs(p[0] - y) < Math.abs(b[0] - y) ? p : b)); return r[1]; };
    const last = (s) => s.data[s.data.length - 1][1];
    const charts = series.map((s) => {
      const W = 300, Ht = 150, L = 8, Rr = W - 8, T = 14, B = 26;
      const x0 = 1960, x1 = Math.max(nowYear, s.data[s.data.length - 1][0]);
      const ymax = Math.max(...s.data.map((p) => p[1])) * 1.08;
      const px = (y) => L + ((y - x0) / (x1 - x0)) * (Rr - L), py = (v) => T + (1 - v / ymax) * (Ht - T - B);
      const sv = svg('svg', { viewBox: `0 0 ${W} ${Ht}`, class: 'chart mini', role: 'img', 'aria-label': t('t.' + s.key) });
      sv.appendChild(svg('line', { x1: L, x2: Rr, y1: Ht - B, y2: Ht - B, stroke: 'var(--axis)' }));
      for (const y of [1960, 1980, 2000, 2020]) sv.appendChild(svg('text', { x: px(y), y: Ht - 8, 'text-anchor': 'middle', class: 'ax' }, String(y)));
      sv.appendChild(svg('polyline', { points: s.data.map((p) => `${px(p[0])},${py(p[1])}`).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      const mark = svg('g', { class: 'yr' });
      const line = svg('line', { y1: T, y2: Ht - B, stroke: 'var(--ink-3)', 'stroke-width': 1 });
      const dot = svg('circle', { r: 5, fill: s.color, stroke: 'var(--bg)', 'stroke-width': 2 });
      mark.append(line, dot); sv.appendChild(mark);
      const val = el('b', { class: 'tv' }, '');
      const wrap = el('figure', { class: 'tchart' }, el('figcaption', null, el('span', { class: 'tn' }, t('t.' + s.key)), ' ', val), sv, el('p', { class: 'small' }, t(s.unit)));
      wrap.update = () => {
        const v = at(s, year);
        mark.style.display = v == null ? 'none' : '';
        if (v != null) { line.setAttribute('x1', px(year)); line.setAttribute('x2', px(year)); dot.setAttribute('cx', px(year)); dot.setAttribute('cy', py(v)); }
        val.textContent = v == null ? '' : s.fmt(v);
      };
      return wrap;
    });
    const text = el('p', { class: 'read t-text', 'aria-live': 'polite' }, '');
    const slider = el('input', { type: 'range', class: 'range', min: '1960', max: String(nowYear), step: '1', id: 't-year', value: String(year) });
    const yearOut = el('output', { for: 't-year', class: 't-out' }, String(year));
    function paint() {
      slider.style.setProperty('--fill', ((year - 1960) / (nowYear - 1960)) * 100 + '%');
      yearOut.textContent = String(year);
      charts.forEach((c) => c.update());
      const pov = at(series[0], year), life = at(series[1], year);
      const lifeNow = last(series[1]);
      text.textContent = pov != null
        ? t('t.text', { year, pov: fmt.dec(pov, pov < 10 ? 1 : 0), povNow: fmt.dec(series[0].data[series[0].data.length - 1][1], 1), life: fmt.dec(life, 1), lifeNow: fmt.dec(lifeNow, 1) })
        : t('t.textNo', { year, life: fmt.dec(life, 1), lifeNow: fmt.dec(lifeNow, 1) });
    }
    slider.addEventListener('input', () => { year = +slider.value; paint(); });
    paint();
    const tbl = HLIA.results.tableView([t('t.year'), t('t.pov'), t('t.life'), t('t.u5')], [1960, 1970, 1980, 1990, 2000, 2010, 2020, nowYear - 1].map((y) => [String(y), at(series[0], y) == null ? '-' : series[0].fmt(at(series[0], y)), at(series[1], y) == null ? '-' : series[1].fmt(at(series[1], y)), at(series[2], y) == null ? '-' : series[2].fmt(at(series[2], y))]));
    return HLIA.results.section('time', 't.title', null, [
      el('div', { class: 't-pick' }, el('label', { for: 't-year', class: 'field-label' }, t('t.year')), slider, yearOut),
      el('div', { class: 'tcharts' }, ...charts), text,
      el('p', { class: 'small' }, t('t.est'), ' ', t('t.alive'), ' ', HLIA.results.infoFor(['pip', 'wdi', 'prb'])), tbl,
    ], { introKey: 't.body', wide: true });
  }

  // ---------- what next ----------
  function nextSection(R) {
    const inc = R.income;
    const yearly = inc.householdMonth ? inc.householdMonth * 12 : 0;
    const local = model.byId[S.a.residence];
    const usdYear = inc.usdMonth * inc.people * 12;
    const links = (arr) => el('ul', { class: 'links', role: 'list' }, ...arr.map(([label, url]) => el('li', null, el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, label))));
    const col = (cls, head, text, extra) => el('div', { class: 'next-col ' + cls }, el('h3', null, head), el('p', { class: 'read' }, text), extra);
    return HLIA.results.section('next', 'n.title', null, [
      el('div', { class: 'next-grid' },
        col('', t('n.hold'), t('n.hold.d')),
        col('', t('n.learn'), t('n.learn.d'), links([['Our World in Data', 'https://ourworldindata.org'], ['Gapminder Dollar Street', 'https://www.gapminder.org/dollar-street'], ['World Bank PIP', 'https://pip.worldbank.org']])),
        col('', t('n.give'), t('n.give.d'), el('div', null, usdYear ? el('p', { class: 'small' }, t('n.give.math', { one: i18n.usd(usdYear * 0.01), ten: i18n.usd(usdYear * 0.1) })) : null,
          links([['GiveWell', 'https://www.givewell.org'], ['Giving What We Can', 'https://www.givingwhatwecan.org'], ['GiveDirectly', 'https://www.givedirectly.org']])))),
      el('div', { class: 'again' }, el('button', { type: 'button', class: 'btn btn-ghost btn-lg', onclick: () => { HLIA.app.setView('wizard'); HLIA.wizard.open(); HLIA.wizard.go(1); } }, t('n.again'))),
    ], { wide: true });
  }

  HLIA.results2 = {
    build(R, st) {
      (st.disposers || []).forEach((f) => f());
      st.disposers = [];
      const out = [passportSection(R, st), basicsSection(R), lotterySection(R, st), timeSection(R)];
      if (HLIA.share) out.push(HLIA.share.section(R));
      out.push(nextSection(R));
      return out;
    },
  };
})(window);
