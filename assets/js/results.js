/* The report: navigation, the 3D story (verdict and money), the pyramid, the eight areas and the
   home-versus-world comparison. The other scenes live in results2.js. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el, svg, fmt, clamp, tween, ease, $, $$ } = HLIA.util;
  const ui = HLIA.ui;
  const S = HLIA.state;
  const model = HLIA.model;
  const i18n = HLIA.i18n;
  const t = (k, v) => i18n.t(k, v);
  const SRC = HLIA.SOURCES;

  const st = { R: null, globe: null, fallback: null, played: false, tryZ: null };
  const topLabel = (aheadShare) => HLIA.util.topLabel(aheadShare);
  const day = (z) => fmt.money(z, 'USD', z < 10 ? 2 : 0);
  const pctInt = (p) => fmt.int(Math.round(p * 100));
  const pctSmart = (p) => { const v = p * 100; return v >= 99.5 ? '99.9' : v < 10 ? fmt.dec(v, 1) : fmt.int(Math.round(v)); };
  const AREA_ICON = { income: 'coin', wealth: 'key', mobility: 'plane', health: 'heart', education: 'school', basics: 'housing', safety: 'shield', stability: 'globe' };

  // ---------- shared helpers (also used by results2.js) ----------
  // An (i) button that lists the sources behind a chart, from the catalog.
  function infoFor(ids, titleKey) {
    const rows = ids.map((id) => {
      const s = SRC[id];
      return [s.name, el('span', null,
        el('span', null, `${s.by}, ${s.when}.`), ' ', el('span', null, s[i18n.lang] || s.en), ' ',
        el('em', { class: 'src-status' }, t('src.status.' + s.status)))];
    });
    const links = ids.map((id) => ({ label: SRC[id].by.split(',')[0].split(' via ')[0], url: SRC[id].url }));
    return ui.info({ title: t(titleKey || 'src.title'), rows, links });
  }
  function section(id, titleKey, vars, kids, { sources, intro, introKey, wide } = {}) {
    const head = el('header', { class: 'r-head' },
      el('div', { class: 'r-title' }, el('h2', { id: id + '-t' }, t(titleKey, vars)), sources ? infoFor(sources) : null),
      intro || (introKey ? el('p', { class: 'read' }, t(introKey, vars)) : null));
    return el('section', { id, class: 'r-scene', 'aria-labelledby': id + '-t' }, el('div', { class: wide ? 'wrap wrap-wide' : 'wrap' }, head, ...kids));
  }
  // A "view as table" button and table for a chart. rows: array of arrays; head: array of strings.
  function tableView(head, rows) {
    const tbl = el('table', { class: 'data-table' }, el('thead', null, el('tr', null, ...head.map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', null, ...rows.map((r) => el('tr', null, ...r.map((c, i) => (i === 0 ? el('th', { scope: 'row' }, c) : el('td', null, c)))))));
    const wrap = el('div', { class: 'table-wrap', hidden: true }, tbl);
    const btn = el('button', { type: 'button', class: 'btn btn-quiet table-toggle', 'aria-expanded': 'false', onclick() {
      const open = wrap.hidden;
      wrap.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? t('tbl.hide') : t('tbl.show');
    } }, t('tbl.show'));
    return el('div', { class: 'table-view' }, btn, wrap);
  }

  // ---------- 3D loading ----------
  function webglOk() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  let loading = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }
  // Loads the globe data and the three.js bundle once.
  function load3d() {
    if (HLIA.Globe3D) return Promise.resolve(true);
    if (!webglOk()) return Promise.resolve(false);
    if (!loading) loading = loadScript('assets/js/data/globe.js').then(() => loadScript('assets/js/globe3d.js')).then(() => !!HLIA.Globe3D).catch(() => false);
    return loading;
  }
  // Make a 3D chart when its box first comes into view, and give it back when the report is rebuilt.
  function lazy3d(host, make) {
    const box = { chart: null };
    if (typeof IntersectionObserver === 'undefined') { host.hidden = true; return box; }
    const io = new IntersectionObserver(async (es) => {
      if (!es[0].isIntersecting || box.chart) return;
      io.disconnect();
      if (!(await load3d())) { host.hidden = true; return; }
      try { box.chart = make(); } catch (e) { host.hidden = true; } // no WebGL: the flat version below still works
    }, { threshold: 0.2 });
    io.observe(host);
    st.disposers.push(() => { io.disconnect(); if (box.chart) { box.chart.dispose(); box.chart = null; } });
    return box;
  }
  HLIA.results = { load3d, infoFor, section, tableView };

  // ---------- navigation ----------
  const NAV = [['place', 'nav.place'], ['money', 'nav.money'], ['pyramid', 'nav.pyramid'], ['areas', 'nav.areas'], ['compare', 'nav.compare'], ['passport', 'nav.passport'], ['basics', 'nav.basics'], ['lottery', 'nav.lottery'], ['time', 'nav.time'], ['share', 'nav.share'], ['method', 'nav.method']];
  function navBar() {
    const nav = el('nav', { class: 'r-nav', 'aria-label': t('nav.label') },
      el('ul', { role: 'list' }, ...NAV.map(([id, key]) => el('li', null, el('a', { href: '#' + id, 'data-sec': id }, t(key))))));
    return nav;
  }
  let navIO = null;
  function watchNav() {
    navIO && navIO.disconnect();
    const links = Object.fromEntries($$('.r-nav a').map((a) => [a.dataset.sec, a]));
    const order = ['place', 'step-money', 'pyramid', 'areas', 'compare', 'passport', 'basics', 'lottery', 'time', 'share', 'method'];
    const live = new Set(); // the sections that cross the reading line right now
    navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? live.add(e.target.id) : live.delete(e.target.id)));
      // the money step sits inside the place section, so when both are live the later one in the list wins
      const last = order.filter((k) => live.has(k)).pop();
      if (!last) return;
      const id = last === 'step-money' ? 'money' : last;
      Object.values(links).forEach((a) => a.removeAttribute('aria-current'));
      if (links[id]) {
        links[id].setAttribute('aria-current', 'true');
        // scroll only the nav strip, never the page (scrollIntoView would cancel a smooth scroll in progress)
        const bar = links[id].closest('.r-nav');
        bar.scrollLeft = links[id].offsetLeft - (bar.clientWidth - links[id].offsetWidth) / 2;
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    order.forEach((id) => { const n = document.getElementById(id); n && navIO.observe(n); });
  }

  // ---------- story: verdict and money ----------
  function verdictNote(top) {
    const p = top * 100;
    return t(p <= 1 ? 'v.note.1' : p <= 10 ? 'v.note.10' : p <= 25 ? 'v.note.25' : p <= 50 ? 'v.note.50' : 'v.note.100');
  }
  const widthFor = (topShare) => 75 + 50 * clamp(topShare, 0, 1); // the more exclusive the group, the narrower the figure

  function storySection(R) {
    const host = el('div', { class: 'globe-host' });
    const labels = el('div', { class: 'story-labels', 'aria-hidden': 'true' });
    const stage = el('div', { class: 'story-stage', role: 'img', 'aria-label': t('v.globe') }, host, labels, el('p', { class: 'story-hint small' }, t('v.hint')));
    const top = R.overall.ahead;

    // verdict
    const pctEl = el('span', { class: 'v-pct' }, '100');
    const numEl = el('p', { class: 'v-num', 'aria-live': 'off' }, el('span', { class: 'v-top' }, i18n.lang === 'es' ? 'Top' : 'Top'), pctEl, el('span', { class: 'v-sym' }, '%'));
    const moreEl = el('p', { class: 'v-more' }, '');
    const clover = el('span', { class: 'v-clover', 'aria-hidden': 'true' });
    const arrow = el('span', { class: 'v-arrow', 'aria-hidden': 'true' });
    const verdict = el('article', { class: 'story-step', id: 'step-verdict' }, el('div', { class: 'story-card' },
      clover,
      el('p', { class: 'v-lead' }, t('v.lead')),
      numEl,
      el('p', { class: 'v-of' }, t('v.of', { pop: i18n.people(HLIA.DATA.meta.pipPop) })),
      moreEl,
      el('p', { class: 'read v-note' }, verdictNote(top)),
      el('div', { class: 'v-actions' },
        el('button', { type: 'button', class: 'btn btn-quiet v-skip', 'data-mode': 'skip', onclick: onStoryButton }, t('v.skip')),
        el('p', { class: 'v-scroll small' }, arrow, t('v.scroll')))));

    // money
    const inc = R.income;
    const m = model.markers;
    const youEl = el('p', { class: 'm-you' }, el('span', { class: 'dot-gold', 'aria-hidden': 'true' }), el('b', null, t('m.you')), ' ', t('m.perDay', { day: day(inc.z) }));
    const ratio = inc.z / m.median;
    const facts = el('ul', { class: 'm-facts', role: 'list' },
      el('li', null, el('b', null, t('m.median')), ' ', t('m.perDay', { day: day(m.median) })),
      el('li', null, ratio >= 1 ? t('m.times', { x: fmt.dec(ratio, ratio < 10 ? 1 : 0) }) : ratio < 0.005 ? t('m.zero') : t('m.timesLess', { x: fmt.dec(ratio, 2) })),
      el('li', null, t('m.p99', { day: day(m.p99) })),
      el('li', null, t('m.line3', { n: i18n.people(HLIA.DATA.meta.pipPop * model.cdf(model.WF, 3)) })));
    const tryTop = el('p', { class: 'm-trytop small', 'aria-live': 'polite' }, '');
    const slider = el('input', { type: 'range', class: 'range', min: '0', max: '1000', step: '1', id: 'm-try', 'aria-describedby': 'm-trytop' });
    tryTop.id = 'm-trytop';
    const posOf = (z) => Math.round(clamp(Math.log(z / 0.5) / Math.log(2000), 0, 1) * 1000);
    const zOf = (p) => 0.5 * Math.pow(2000, p / 1000);
    slider.value = String(posOf(inc.z));
    slider.style.setProperty('--fill', slider.value / 10 + '%');
    // the button and the line of text have a row of their own that is always there, so the card keeps its height
    const resetBtn = el('button', { type: 'button', class: 'btn btn-quiet', disabled: true, onclick() { setTry(null); } }, t('m.reset'));
    resetBtn.style.visibility = 'hidden';
    function setTry(z) {
      st.tryZ = z;
      const zz = z == null ? inc.z : z;
      slider.value = String(posOf(zz)); slider.style.setProperty('--fill', slider.value / 10 + '%');
      resetBtn.disabled = z == null;
      resetBtn.style.visibility = z == null ? 'hidden' : '';
      tryTop.textContent = z == null ? '' : t('m.tryTop', { day: day(zz), pct: pctSmart(1 - model.cdf(model.WF, zz)) });
      if (st.globe) st.globe.setUser({ z: zz, id: S.a.residence });
      if (st.fallback) st.fallback.setUser({ z: zz, id: S.a.residence });
    }
    slider.addEventListener('input', () => setTry(zOf(+slider.value)));
    const seg = el('div', { class: 'seg', role: 'group' },
      el('button', { type: 'button', 'aria-pressed': 'true', 'data-m': 'globe', onclick: () => setMode('globe') }, t('m.globe')),
      el('button', { type: 'button', 'aria-pressed': 'false', 'data-m': 'skyline', onclick: () => setMode('skyline') }, t('m.sky')));
    const money = el('article', { class: 'story-step', id: 'step-money' }, el('div', { class: 'story-card' },
      el('h2', { id: 'money-t' }, t('m.title')), el('p', { class: 'read' }, t('m.body')),
      youEl, facts,
      el('div', { class: 'm-try' }, el('label', { for: 'm-try', class: 'field-label' }, t('m.try')), slider, el('div', { class: 'm-tryrow' }, tryTop, resetBtn)),
      seg,
      el('p', { class: 'small m-src' }, t('m.src'), ' ', infoFor(['pip', 'pipLines', 'gwwc']))));

    // the page's one h1 while the report is showing, for screen readers and the outline
    const sec = el('section', { id: 'place', class: 'story', 'aria-label': t('nav.place') }, el('h1', { class: 'sr-only' }, t('v.h1')), stage,
      el('div', { class: 'story-steps' }, verdict, el('div', { id: 'money', class: 'story-anchor' }), money));
    sec.refs = { host, labels, pctEl, numEl, moreEl, seg, setTry, clover, arrow };
    return sec;
  }

  // counter during the wave
  function setCounter(refs, e) {
    const R = st.R, top = R.overall.ahead;
    const v = 1 - (1 - top) * e; // share of people ahead of the current threshold, falling to yours
    refs.pctEl.textContent = topLabel(v);
    refs.numEl.style.fontStretch = widthFor(v) + '%';
    refs.moreEl.textContent = t('v.more', { n: i18n.people(R.overall.behind * e) });
  }
  function finishCounter(refs) {
    setCounter(refs, 1);
    refs.numEl.setAttribute('aria-label', t('hud.top', { pct: topLabel(st.R.overall.ahead) }));
    // The button keeps its place so the card never changes height: it says "skip" while the
    // reveal plays and "play it again" after. The flat fallback has nothing to replay.
    const btn = document.querySelector('.v-skip');
    if (btn) {
      btn.dataset.mode = 'replay';
      btn.textContent = t('v.replay');
      btn.style.visibility = st.globe ? '' : 'hidden';
    }
  }
  function skipStory() {
    const refs = st.refs;
    if (st.globe) st.globe.finishAll();
    if (st.fallback) st.fallback.finish();
    finishCounter(refs);
  }
  function replayStory() {
    const btn = document.querySelector('.v-skip');
    if (btn) { btn.dataset.mode = 'skip'; btn.textContent = t('v.skip'); }
    playStory(st.refs);
  }
  const onStoryButton = (ev) => (ev.currentTarget.dataset.mode === 'replay' ? replayStory() : skipStory());

  async function playStory(refs) {
    setCounter(refs, 0);
    const reduced = HLIA.util.reducedMotion();
    const R = st.R;
    if (st.globe) {
      const g = st.globe;
      g.pointsMat.uniforms.uWave.value = 0;
      // reduced motion, or the page came back already scrolled below the verdict: show the result, skip the show
      const verdict = document.getElementById('step-verdict');
      const scrolledPast = !!verdict && verdict.getBoundingClientRect().bottom < 140;
      if (reduced || g.mix > 0.02 || scrolledPast) { g.setWaveInstant(); finishCounter(refs); return; }
      // the number starts to fall at once: the camera comes in while the lights turn on, not before
      const fly = g.flyIn(2400);
      await g.wave(4000, (lit, e) => setCounter(refs, e));
      await fly;
      finishCounter(refs);
    } else if (st.fallback) {
      const f = st.fallback;
      if (reduced) { finishCounter(refs); return; }
      // the dots move into the income picture, and the sweep starts a moment later, while they are still on their way
      const morph = f.setMode('income', { duration: 1800 });
      await new Promise((r) => setTimeout(r, 300));
      await f.sweep(3800, (e) => setCounter(refs, e));
      await morph;
      finishCounter(refs);
    } else finishCounter(refs);
  }

  function setMode(mode) {
    const refs = st.refs;
    refs.seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    if (st.globe) st.globe.setMode(mode, HLIA.util.reducedMotion() ? 0 : 2600);
    if (st.fallback) st.fallback.setMode(mode === 'skyline' ? 'income' : 'map', { duration: 1800 });
  }

  // keep the 3D labels (axis ticks, you, median) in step with the camera
  function labelLayer(refs) {
    const ticks = [1, 3, 10, 30, 100, 300, 1000].map((z) => ({ z, node: el('span', { class: 'lbl' }, '$' + fmt.int(z)) }));
    const you = el('span', { class: 'lbl lbl-you' }, t('m.you'));
    const med = el('span', { class: 'lbl lbl-med' }, t('m.median'));
    const axis = el('span', { class: 'lbl lbl-axis' }, t('m.axis'));
    refs.labels.replaceChildren(...ticks.map((x) => x.node), you, med, axis);
    return function update(g) {
      const on = g.mix > 0.97;
      refs.labels.classList.toggle('on', on);
      if (!on) return;
      const base = g.sky.baseY - 0.07;
      for (const tk of ticks) { const p = g.project(g.sky.xOfZ(tk.z), base, 0); tk.node.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, 0)`; }
      const y = g.youScreen();
      if (y) you.style.transform = `translate(${y.x}px, ${y.y - 52}px) translate(-50%, -100%)`;
      const pm = g.project(g.sky.xOfZ(model.markers.median), g.sky.baseY - 0.07, 0);
      med.style.transform = `translate(${pm.x}px, ${pm.y + 22}px) translate(-50%, 0)`;
      const pa = g.project(0, base, 0);
      axis.style.transform = `translate(${pa.x}px, ${pa.y + 46}px) translate(-50%, 0)`;
    };
  }

  // On a wide screen the globe sits in the free strip to the right of the verdict card, and the skyline in the
  // free strip to the left of the money card. This measures those strips, so a card can never cover the picture.
  // It returns where each picture is centred (as a share of the stage width) and how much room it has.
  function stageLayout(w) {
    const stage = st.refs && st.refs.host.parentElement;
    if (stage) stage.style.removeProperty('--hint-x');
    if (w < 900 || !st.refs) return { globe: 0, sky: 0 };
    const host = st.refs.host.getBoundingClientRect();
    const edge = 16, gap = 28;
    const vc = document.querySelector('#step-verdict .story-card');
    const mc = document.querySelector('#step-money .story-card');
    // the cards only move up and down while scrolling, so their sides are stable
    let g0 = w * 0.5, g1 = w - edge, s0 = edge, s1 = w * 0.5;
    if (vc) g0 = vc.getBoundingClientRect().right - host.left + gap;
    if (mc) s1 = mc.getBoundingClientRect().left - host.left - gap;
    g0 = Math.min(g0, w * 0.75);
    s1 = Math.max(s1, w * 0.25);
    const centre = (a, b) => ((a + b) / 2 - w / 2) / w;
    if (stage) stage.style.setProperty('--hint-x', (g0 + g1) / 2 + 'px');
    return { globe: centre(g0, g1), sky: centre(s0, s1), globeW: (g1 - g0) / w, skyW: (s1 - s0) / w };
  }

  async function mountStage(sec) {
    const refs = sec.refs;
    st.refs = refs;
    const R = st.R;
    const ok = await load3d();
    const user = { z: R.income.z, id: S.a.residence };
    if (ok) {
      try {
        const onLabels = labelLayer(refs);
        if (st.globe) { st.globe.opts.onFrame = onLabels; st.globe.opts.onHover = hoverTip; st.globe.attach(refs.host); }
        else {
          st.globe = new HLIA.Globe3D(refs.host, { reduced: HLIA.util.reducedMotion(), onHover: hoverTip, onFrame: onLabels, shift: stageLayout });
        }
        st.globe.setUser(user);
        return;
      } catch (e) { st.globe = null; }
    }
    // fallback without WebGL: the flat dot picture, set to the right of the cards
    sec.classList.add('flat');
    const hint = sec.querySelector('.story-hint');
    if (hint) hint.textContent = t('v.hint.flat');
    if (st.fallback) { st.fallback.destroy(); st.fallback = null; } // a rebuild (new language) replaced its host
    const canvas = el('canvas', { 'aria-hidden': 'true' });
    refs.host.replaceChildren(canvas);
    st.fallback = new HLIA.DotField(canvas, { mode: 'map', glow: true, interactive: true, mapAnchor: 0.3, margins: { l: 24, r: 24, t: 24, b: 84 }, onHover: (i) => i && hoverTip({ index: i.index, clientX: canvas.getBoundingClientRect().left + i.x, clientY: canvas.getBoundingClientRect().top + i.y }) });
    st.fallback.setUser(user); st.fallback.setColorBy('split');
  }
  function hoverTip(h) {
    if (!h) { ui.tip.hide(); return; }
    const P = HLIA.people, c = P.country(h.index);
    ui.tip.show([el('strong', null, i18n.countryName(c)),
      el('div', null, t('v.hover', { country: '', n: fmt.int(Math.round(c.pop / 1e6)) }).replace(/^:\s*/, '')),
      el('div', null, t('v.hoverIncome', { day: day(P.z[h.index]) }))], h.clientX, h.clientY);
  }

  // when each step comes into view
  let stepIO = null;
  function watchSteps(refs) {
    stepIO && stepIO.disconnect();
    stepIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        if (e.target.id === 'step-money') setMode('skyline');
        if (e.target.id === 'step-verdict') setMode('globe');
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 }); // fires when a step crosses the middle of the screen
    ['step-verdict', 'step-money'].forEach((id) => stepIO.observe(document.getElementById(id)));
  }

  // ---------- pyramid ----------
  function pyramidSection(R) {
    const edges = model.BAND_EDGES;
    const you = model.bandOf(R.overall.pct);
    const pop = HLIA.DATA.meta.pipPop;
    const share = (k) => edges[k + 1] - edges[k];
    const rows = [];
    for (let k = 6; k >= 0; k--) {
      const w = 7 + 93 * Math.sqrt(share(k) / 0.5); // percent of the row; the square root keeps the narrow steps visible
      const people = i18n.people(share(k) * pop, { bare: true });
      const bar = el('span', { class: 'pyr-bar', style: { width: w + '%', background: k === you ? 'var(--you)' : `var(--ramp-v${7 - k})` } });
      const row = el('li', { class: 'pyr-row' + (k === you ? ' you' : ''), tabindex: '0', 'data-k': k, 'aria-label': `${t('p.b' + k)}: ${t('p.people', { n: i18n.people(share(k) * pop) })}${k === you ? '. ' + t('p.you') : ''}` },
        el('span', { class: 'pyr-name' }, t('p.b' + k)),
        el('span', { class: 'pyr-track', style: { '--w': w + '%' } }, bar, k === you ? el('span', { class: 'pyr-you' }, t('p.you')) : null),
        el('span', { class: 'pyr-n' }, people));
      const show = (ev) => {
        if (list.closest('.has3d')) return; // the 3D chart is up and the steps are only for screen readers
        const r = row.getBoundingClientRect();
        ui.tip.show([el('strong', null, people), el('div', null, t('p.b' + k)), el('div', { class: 'small' }, t('p.range', { a: fmt.dec(edges[k] * 100, edges[k] * 100 % 1 ? 1 : 0), b: fmt.dec(edges[k + 1] * 100, edges[k + 1] * 100 % 1 ? 1 : 0) }))], ev.clientX || r.left + r.width / 2, ev.clientY || r.top);
      };
      row.addEventListener('pointermove', show); row.addEventListener('focus', show); row.addEventListener('pointerleave', () => ui.tip.hide()); row.addEventListener('blur', () => ui.tip.hide());
      rows.push(row);
    }
    const list = el('ol', { class: 'pyr', role: 'list', 'aria-label': t('p.alt', { step: t('p.b' + you) }) }, ...rows);
    const tbl = tableView([t('tbl.area'), t('tbl.people'), t('tbl.share')], [6, 5, 4, 3, 2, 1, 0].map((k) => [t('p.b' + k), i18n.people(share(k) * pop, { bare: true }), fmt.dec(share(k) * 100, share(k) * 100 < 1 ? 1 : 0) + '%']));

    // the same pyramid in 3D: one slab per step, as wide as its share of people, with a dot for about a million of them
    const host = el('div', { class: 'c3-host pyr3d', role: 'img', 'aria-label': t('p.alt', { step: t('p.b' + you) }) });
    const rowByK = {};
    rows.forEach((r) => { rowByK[r.dataset.k] = r; });
    const mark = (k) => { rows.forEach((r) => r.classList.toggle('hot', +r.dataset.k === k)); };
    const wrap = el('div', { class: 'pyr-wrap' }, host, list);
    const DOT = 2e6; // one dot on a step is about two million people
    const view = lazy3d(host, () => {
      const chart = new HLIA.Pyramid3D(host, {
        tiers: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ k, share: share(k), color: PYRAMID_TINT[k], name: t('p.b' + k), count: i18n.people(share(k) * pop, { bare: true }) })),
        you, dots: Math.round(pop / DOT), colors: { you: HLIA.util.cssVar('--you') || '#ffc14d' },
        labels: { you: t('p.you'), dot: t('p.dot', { n: i18n.people(DOT, { bare: true }) }) }, reduced: HLIA.util.reducedMotion(),
        onHover(h) {
          if (!h) { ui.tip.hide(); mark(-1); return; }
          const k = h.index;
          mark(k);
          ui.tip.show([el('strong', null, i18n.people(share(k) * pop, { bare: true })), el('div', null, t('p.b' + k)), el('div', { class: 'small' }, t('p.range', { a: fmt.dec(edges[k] * 100, edges[k] * 100 % 1 ? 1 : 0), b: fmt.dec(edges[k + 1] * 100, edges[k + 1] * 100 % 1 ? 1 : 0) }))], h.clientX, h.clientY);
        },
      });
      host.appendChild(el('button', { type: 'button', class: 'btn btn-quiet c3-replay', onclick: () => chart.play() }, ui.icon('refresh'), ' ', t('c3.replay')));
      host.c3 = chart;
      wrap.classList.add('has3d'); // the chart carries the names and counts itself, so the flat steps stay for screen readers only
      return chart;
    });
    // pointing at a row lifts its slab
    rows.forEach((r) => {
      r.addEventListener('pointerenter', () => view.chart && view.chart.highlight(+r.dataset.k));
      r.addEventListener('focus', () => view.chart && view.chart.highlight(+r.dataset.k));
      r.addEventListener('pointerleave', () => view.chart && view.chart.highlight(-1));
      r.addEventListener('blur', () => view.chart && view.chart.highlight(-1));
    });
    return section('pyramid', 'p.title', null, [wrap, tbl], { introKey: 'p.body', sources: ['pip', 'wdi', 'ubs', 'wgi'], wide: true });
  }
  // the slabs of the 3D pyramid, from the bottom half up to the top 0.1%
  const PYRAMID_TINT = ['#5a49d6', '#6a58e4', '#7d6bf0', '#9a8bf8', '#b5a8ff', '#cfc6ff', '#ece8ff'];

  // ---------- eight areas ----------
  function areaText(d, R) {
    const c = model.byId[S.a.residence];
    const a = S.forModel();
    const wd = model.markers;
    switch (d.id) {
      case 'income': return t('a.d.income', { day: day(d.z), median: day(wd.median) });
      case 'wealth': {
        const med = i18n.usd(model.worldWealthQuantile(0.5), 0);
        return d.estimated ? t('a.d.wealth.est', { usd: i18n.usd(Math.round(d.usd / 100) * 100), median: med }) : t('a.d.wealth.said', { bracket: t('a.bracket.' + a.netWorth.bracket), median: med });
      }
      case 'mobility': return t('a.d.mobility', { n: d.reach, of: d.outOf, rank: d.rank }) + ' ' + t(a.travel ? 'a.d.mobility.travel' : 'a.d.mobility.notravel');
      case 'health': return t('a.d.health', { uhc: fmt.int(Math.round(d.uhc)), score: fmt.int(Math.round(d.score)) });
      case 'education': return t('a.d.education', { level: t('a.edu.' + a.education), pct: pctInt(d.global) });
      case 'basics': return t('a.d.basics', { n: d.count, pct: pctInt(d.global) });
      case 'safety': return t('a.d.safety', { score: fmt.dec(d.count, 1) });
      case 'stability': {
        const pen = Math.round(d.base - d.score);
        return t(pen > 0 ? 'a.d.stability' : 'a.d.stability.none', { base: fmt.int(Math.round(d.base)), pen: fmt.int(pen) });
      }
      default: return '';
    }
  }
  const AREA_SOURCES = {
    income: ['pip', 'pipLines', 'wdi', 'indec', 'fx'], wealth: ['ubs', 'ubs2022', 'wir'], mobility: ['passport', 'blocs', 'henley', 'gossling'], health: ['uhc', 'uhcgmr'],
    education: ['edstats', 'hdr', 'wic'], basics: ['wdi', 'jmp', 'sdg7', 'itu', 'fao', 'unhabitat'], safety: ['ilo', 'findex', 'gallup', 'wdi'], stability: ['wgi', 'freedom'],
  };
  function areasSection(R) {
    const c = model.byId[S.a.residence];
    const rows = R.dims.map((d) => {
      const fill = el('span', { class: 'bar-fill', style: { width: '0%' } });
      const row = el('li', { class: 'area-row', 'data-id': d.id, tabindex: '0' },
        el('div', { class: 'area-head' },
          el('span', { class: 'area-ico' }, ui.icon(AREA_ICON[d.id])),
          el('span', { class: 'area-name' }, t('dim.' + d.id)),
          el('span', { class: 'area-val' }, el('b', null, t('a.top', { pct: topLabel(1 - d.global) })), ' ', el('span', { class: 'area-sub' }, t('a.ahead', { pct: pctInt(d.global) }))),
          infoFor(AREA_SOURCES[d.id])),
        el('div', { class: 'bar', role: 'img', 'aria-label': `${t('dim.' + d.id)}: ${t('a.ahead', { pct: pctInt(d.global) })}` }, fill),
        el('p', { class: 'area-text' }, areaText(d, R), ' ', el('span', { class: 'q q-' + d.data }, t('a.q.' + d.data))));
      row.fill = fill; row.target = d.global;
      const show = (ev) => ui.tip.show([el('strong', null, t('a.top', { pct: topLabel(1 - d.global) })), el('div', null, `${t('dim.' + d.id)}: ${t('a.ahead', { pct: pctInt(d.global) })}`)], ev.clientX || row.getBoundingClientRect().left + 120, ev.clientY || row.getBoundingClientRect().top);
      row.querySelector('.bar').addEventListener('pointermove', show);
      row.querySelector('.bar').addEventListener('pointerleave', () => ui.tip.hide());
      row.addEventListener('focus', show); row.addEventListener('blur', () => ui.tip.hide());
      return row;
    });
    const list = el('ul', { class: 'areas', role: 'list' }, ...rows);
    const tbl = tableView([t('tbl.area'), t('tbl.value')], R.dims.map((d) => [t('dim.' + d.id), `${t('a.ahead', { pct: pctInt(d.global) })} (${t('a.top', { pct: topLabel(1 - d.global) })})`]));
    const estNote = c.est && c.est.length > 4 ? el('p', { class: 'small' }, t('a.est')) : null;
    // the same eight areas as towers in 3D: your height in emerald, the typical person in your country as a violet ring
    const country = i18n.countryName(c);
    const host = el('div', { class: 'c3-host towers3d', role: 'img', 'aria-label': t('tw.alt', { country }) });
    const keyItem = (color, text) => el('span', null, el('i', { style: { background: color } }), text);
    host.appendChild(el('div', { class: 'c3-key' }, keyItem('var(--ahead)', t('c.you')), keyItem('var(--context)', t('c.typical', { country })), keyItem('var(--you)', t('tw.overall'))));
    const hot = (id) => rows.forEach((r) => r.classList.toggle('hot', r.dataset.id === id));
    const view = lazy3d(host, () => {
      const chart = new HLIA.Towers3D(host, {
        areas: R.dims.map((d) => ({ id: d.id, value: d.global, typical: d.typical, text: t('a.top', { pct: topLabel(1 - d.global) }), name: t('dim.' + d.id), icon: ui.icon(AREA_ICON[d.id]) })),
        overall: { value: R.overall.pct, text: t('a.top', { pct: topLabel(R.overall.ahead) }), name: t('tw.overall') },
        colors: { you: HLIA.util.cssVar('--you') || '#ffc14d', area: HLIA.util.cssVar('--ahead') || '#35d6a0', typical: HLIA.util.cssVar('--context') || '#9b8cff' },
        labels: { ahead: t('tw.ahead'), all: t('tw.all'), half: t('tw.half') }, reduced: HLIA.util.reducedMotion(),
        onHover(h) {
          if (!h) { ui.tip.hide(); hot(null); return; }
          const d = R.dims[h.index];
          hot(d.id);
          ui.tip.show([el('strong', null, `${t('dim.' + d.id)}: ${t('a.top', { pct: topLabel(1 - d.global) })}`), el('div', null, `${t('c.typical', { country })}: ${t('a.top', { pct: topLabel(1 - d.typical) })}`)], h.clientX, h.clientY);
        },
      });
      host.appendChild(el('button', { type: 'button', class: 'btn btn-quiet c3-replay', onclick: () => chart.play() }, ui.icon('refresh'), ' ', t('c3.replay')));
      host.c3 = chart;
      return chart;
    });
    rows.forEach((r, i) => {
      r.addEventListener('pointerenter', () => view.chart && view.chart.highlight(i));
      r.addEventListener('pointerleave', () => view.chart && view.chart.highlight(-1));
    });
    const sec = section('areas', 'a.title', null, [host, list, estNote, tbl], { introKey: 'a.body', wide: true });
    // each bar fills when its own row comes into view, so a tall list on a short screen still fills
    const fillRow = (r) => { r.fill.style.width = r.target * 100 + '%'; };
    if (typeof IntersectionObserver === 'undefined') rows.forEach(fillRow);
    else {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        setTimeout(() => fillRow(e.target), HLIA.util.reducedMotion() ? 0 : 120);
      }), { threshold: 0.6 });
      rows.forEach((r) => io.observe(r));
    }
    return sec;
  }

  // ---------- home and world ----------
  function compareSection(R) {
    const c = model.byId[S.a.residence];
    const name = i18n.countryName(c);
    const get = (id) => R.dims.find((d) => d.id === id);
    const local = ['income', 'wealth', 'education', 'basics'].map((id) => ({ id, d: get(id) }));
    const host = el('div', { class: 'cmp-host' });
    const seg = el('div', { class: 'seg', role: 'group' });
    let view = 'dumbbell';

    // On a phone the plot is redrawn narrower, with each label above its row, so the text stays readable.
    const mq = window.matchMedia('(max-width: 40rem)');
    const nameL = t('c.local', { country: name }), nameW = t('c.world'), nameY = t('c.you'), nameT = t('c.typical', { country: name });
    const homeRows = local.map(({ id, d }) => ({ id, a: d.local, b: d.global }));
    const neighbourRows = R.dims.map((d) => ({ id: d.id, a: d.typical, b: d.global }));
    const kinds = {
      home: { a: { color: 'var(--series-1)', label: nameL }, b: { color: 'var(--series-2)', label: nameW } },
      neighbour: { a: { color: 'var(--series-2)', label: nameT }, b: { color: 'var(--you)', label: nameY } },
    };

    // Two dots per row, joined by a line. The b dot is the larger one and sits underneath,
    // so two equal values still show both.
    function pairs(rows, kind, aria) {
      const narrow = mq.matches, A = kinds[kind].a, B = kinds[kind].b;
      const W = narrow ? 340 : 720, rowH = narrow ? 62 : 64, y0 = narrow ? 56 : 60, H = y0 + rows.length * rowH;
      const L = narrow ? 12 : 150, Rr = narrow ? W - 48 : W - 30;
      const x = (p) => L + p * (Rr - L);
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' + (narrow ? ' narrow' : ''), role: 'img', 'aria-label': aria });
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        s.appendChild(svg('line', { x1: x(p), x2: x(p), y1: narrow ? 14 : 30, y2: H - 20, stroke: 'var(--grid)', 'stroke-width': 1 }));
        s.appendChild(svg('text', { x: x(p), y: H - 4, 'text-anchor': 'middle', class: 'ax' }, fmt.int(p * 100) + '%'));
      }
      rows.forEach(({ id, a, b }, i) => {
        const y = y0 + i * rowH;
        const xa = x(a), xb = x(b);
        s.appendChild(svg('text', { x: 0, y: narrow ? y - 20 : y + 5, class: 'rowlbl' }, t('dim.' + id)));
        s.appendChild(svg('line', { x1: Math.min(xa, xb), x2: Math.max(xa, xb), y1: y, y2: y, stroke: 'var(--line-2)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
        const close = Math.abs(xa - xb) < 16;
        const line = (label, val) => el('div', null, `${label}: ${t('a.ahead', { pct: pctInt(val) })}`);
        const mk = (cx, K, r, val) => {
          const g = svg('g', { tabindex: '0', class: 'pt' });
          g.appendChild(svg('circle', { cx, cy: y, r: 14, fill: 'transparent' }));
          g.appendChild(svg('circle', { cx, cy: y, r, fill: K.color, stroke: 'var(--bg)', 'stroke-width': 2 }));
          const show = (ev) => {
            const box = g.getBoundingClientRect();
            const body = close ? [el('strong', null, t('dim.' + id)), line(A.label, a), line(B.label, b)] : [el('strong', null, t('a.top', { pct: topLabel(1 - val) })), line(K.label, val)];
            ui.tip.show(body, ev.clientX || box.left + 8, ev.clientY || box.top);
          };
          g.addEventListener('pointermove', show); g.addEventListener('focus', show); g.addEventListener('pointerleave', () => ui.tip.hide()); g.addEventListener('blur', () => ui.tip.hide());
          return g;
        };
        s.appendChild(mk(xb, B, 9, b));
        s.appendChild(mk(xa, A, 5.5, a));
        const hi = Math.max(xa, xb), lo = Math.min(xa, xb);
        s.appendChild(svg('text', { x: xa <= xb ? lo - 14 : hi + 14, y: y + 5, 'text-anchor': xa <= xb ? 'end' : 'start', class: 'vl' }, pctInt(a) + '%'));
        s.appendChild(svg('text', { x: xa <= xb ? hi + 14 : lo - 14, y: y + 5, 'text-anchor': xa <= xb ? 'start' : 'end', class: 'vl' }, pctInt(b) + '%'));
      });
      return s;
    }
    function radar() {
      const N = R.dims.length, size = 520, cx = size / 2, cy = size / 2, rad = 170;
      const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; return [cx + Math.cos(a) * rad * v, cy + Math.sin(a) * rad * v]; };
      const s = svg('svg', { viewBox: `0 0 ${size} ${size}`, class: 'chart radar', role: 'img', 'aria-label': t('c.view.radar') });
      for (const k of [0.25, 0.5, 0.75, 1]) s.appendChild(svg('polygon', { points: R.dims.map((_, i) => pt(i, k).join(',')).join(' '), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 1 }));
      R.dims.forEach((d, i) => {
        const [x1, y1] = pt(i, 1), [lx, ly] = pt(i, 1.2);
        s.appendChild(svg('line', { x1: cx, y1: cy, x2: x1, y2: y1, stroke: 'var(--grid)' }));
        s.appendChild(svg('text', { x: lx, y: ly + 4, 'text-anchor': Math.abs(lx - cx) < 12 ? 'middle' : lx < cx ? 'end' : 'start', class: 'rowlbl' }, t('dim.' + d.id)));
      });
      const poly = (key, stroke, fill) => s.appendChild(svg('polygon', { points: R.dims.map((d, i) => pt(i, d[key]).join(',')).join(' '), fill, stroke, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      poly('typical', 'var(--series-2)', 'rgba(138,120,238,0.12)');
      poly('global', 'var(--you)', 'rgba(255,193,77,0.12)');
      R.dims.forEach((d, i) => {
        for (const [key, col] of [['typical', 'var(--series-2)'], ['global', 'var(--you)']]) {
          const [x, y] = pt(i, d[key]);
          const g = svg('g', { tabindex: '0', class: 'pt' });
          g.appendChild(svg('circle', { cx: x, cy: y, r: 14, fill: 'transparent' }));
          g.appendChild(svg('circle', { cx: x, cy: y, r: 5, fill: col, stroke: 'var(--bg)', 'stroke-width': 2 }));
          const show = (ev) => { const r = g.getBoundingClientRect(); ui.tip.show([el('strong', null, t('a.top', { pct: topLabel(1 - d[key]) })), el('div', null, `${t('dim.' + d.id)}: ${key === 'global' ? t('c.you') : t('c.typical', { country: name })}`)], ev.clientX || r.left + 6, ev.clientY || r.top); };
          g.addEventListener('pointermove', show); g.addEventListener('focus', show); g.addEventListener('pointerleave', () => ui.tip.hide()); g.addEventListener('blur', () => ui.tip.hide());
          s.appendChild(g);
        }
      });
      return s;
    }
    function legend() {
      return view === 'dumbbell'
        ? el('div', { class: 'legend' }, el('span', null, el('i', { class: 'key', style: { background: 'var(--series-1)' } }), nameL), el('span', null, el('i', { class: 'key', style: { background: 'var(--series-2)' } }), nameW))
        : el('div', { class: 'legend' }, el('span', null, el('i', { class: 'key', style: { background: 'var(--you)' } }), nameY), el('span', null, el('i', { class: 'key', style: { background: 'var(--series-2)' } }), nameT));
    }
    function chart() {
      if (view === 'dumbbell') return pairs(homeRows, 'home', t('c.view.dumbbell', { country: name }));
      return mq.matches ? pairs(neighbourRows, 'neighbour', t('c.view.radar')) : radar();
    }
    const insight = el('p', { class: 'read cmp-insight' }, '');
    const notes = el('p', { class: 'small' }, '');
    function paint() {
      seg.replaceChildren(
        el('button', { type: 'button', 'aria-pressed': String(view === 'dumbbell'), onclick() { view = 'dumbbell'; paint(); } }, t('c.view.dumbbell', { country: name })),
        el('button', { type: 'button', 'aria-pressed': String(view === 'radar'), onclick() { view = 'radar'; paint(); } }, t('c.view.radar')));
      host.replaceChildren(chart(), legend());
      const inc = get('income');
      insight.textContent = Math.abs(inc.local - inc.global) < 0.02 ? t('c.insight.same', { g: pctInt(inc.global) }) : t('c.insight', { l: pctInt(inc.local), g: pctInt(inc.global), country: name });
      notes.textContent = view === 'dumbbell' ? t('c.noLocal') : t('c.radarNote', { country: name });
    }
    paint();
    // redraw when the screen crosses the phone breakpoint (turning the device, resizing the window)
    const onMq = () => { if (!host.isConnected) { mq.removeEventListener('change', onMq); return; } paint(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    const tbl = tableView([t('tbl.area'), t('c.local', { country: name }), t('c.world'), t('c.typical', { country: name })],
      R.dims.map((d) => [t('dim.' + d.id), d.local != null ? pctInt(d.local) + '%' : '-', pctInt(d.global) + '%', pctInt(d.typical) + '%']));
    return section('compare', 'c.title', { country: name }, [el('div', { class: 'cmp-tools' }, seg), host, insight, notes, tbl], { introKey: 'c.body', sources: ['pip', 'ubs', 'edstats', 'wdi'] });
  }

  // ---------- build the whole report ----------
  function build() {
    (st.disposers || []).forEach((f) => f());
    st.disposers = [];
    const R = st.R;
    const root = $('#results');
    const story = storySection(R);
    const kids = [navBar(), story, pyramidSection(R), areasSection(R), compareSection(R)];
    if (HLIA.results2) kids.push(...HLIA.results2.build(R, st));
    root.replaceChildren(...kids);
    if (HLIA.method) $('#method-slot').replaceChildren(HLIA.method.build());
    watchNav();
    return story;
  }

  // the clover and the bobbing arrow on the verdict card (the card is built again when the language changes)
  function startFx(refs) { if (HLIA.fx) { HLIA.fx.clover(refs.clover); HLIA.fx.arrow(refs.arrow); } }

  async function show() {
    st.R = S.compute();
    if (!st.R) return;
    const first = !st.played;
    const story = build();
    await mountStage(story);
    startFx(story.refs);
    watchSteps(story.refs);
    if (first) { st.played = true; requestAnimationFrame(() => playStory(story.refs)); } // no wait: the number falls as soon as the page is up
    else { finishCounter(story.refs); if (st.globe) st.globe.setWaveInstant(); }
  }
  // rebuild text when the language changes; keep the globe
  HLIA.bus.on('lang', () => { if (S.view === 'results' && st.R) { st.R = S.compute(); const story = build(); mountStage(story).then(() => { startFx(story.refs); watchSteps(story.refs); finishCounter(story.refs); st.globe && st.globe.setWaveInstant(); }); } });

  HLIA.results.show = show;
  HLIA.results.state = st;
  HLIA.results.helpers = { day, pctInt, pctSmart, topLabel, AREA_ICON };
})(window);
