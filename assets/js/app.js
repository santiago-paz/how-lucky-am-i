/* Starts the page and moves between the three views: intro, form, results. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { $, $$, el, fmt } = HLIA.util;
  const S = HLIA.state;
  const i18n = HLIA.i18n;
  const ui = HLIA.ui;
  const t = (k, v) => i18n.t(k, v);

  let hero = null;

  function paintIntro() {
    $('#intro-title').textContent = t('intro.title', { pop: i18n.people(HLIA.DATA.meta.pipPop) });
  }
  function paintLang() {
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === i18n.lang)));
  }
  function paintFooter() {
    $('#foot').replaceChildren(
      el('p', null, t('foot.privacy')),
      el('p', null, t('foot.data')),
    );
  }

  // ---------- hero hover ----------
  function heroHover(info) {
    if (!info) { ui.tip.hide(); return; }
    const c = info.country;
    const r = $('#hero-canvas').getBoundingClientRect();
    ui.tip.show([
      el('strong', null, i18n.countryName(c)),
      el('div', null, t('intro.tipPeople', { n: fmt.int(Math.round(c.pop / 1e6)) })),
      el('div', null, t('intro.tipMedian', { day: fmt.money(c.med, 'USD', c.med < 10 ? 2 : 0) })),
    ], r.left + info.x, r.top + info.y);
  }

  // ---------- views ----------
  function setView(v, { push = true } = {}) {
    S.view = v;
    document.body.dataset.view = v;
    $('#intro').hidden = v !== 'intro';
    $('#wizard').hidden = v !== 'wizard';
    $('#results').hidden = v !== 'results';
    $('#restart').hidden = v === 'intro';
    ui.tip.hide();
    if (push) history.pushState({ v }, '', v === 'intro' ? location.pathname + location.search : '#/' + v);
    scrollTo(0, 0);
    S.save();
    if (v === 'intro' && hero) hero.render();
  }
  function start() {
    setView('wizard');
    HLIA.wizard.open();
  }
  function reveal() {
    setView('results');
    if (HLIA.results) HLIA.results.show();
  }
  function restart() {
    if (S.maxStep > 1 || S.view === 'results') {
      if (!global.confirm(t('restart.confirm'))) return;
    }
    S.reset();
    const g = S.guessCountry();
    if (g) { S.a.residence = g; S.a.passports = [g]; }
    HLIA.wizard.render();
    setView('intro');
  }

  function viewFromHash() {
    const m = /^#\/(wizard|results)$/.exec(location.hash);
    return m ? m[1] : 'intro';
  }
  function canShowResults() {
    return !!(S.a.residence && S.a.passports.length && S.a.education && S.a.health && S.a.tenure);
  }

  // The "pause motion" button in the bar. The choice is kept for the next visit.
  function setMotion(off, { save = true } = {}) {
    const root = document.documentElement;
    if (off) root.dataset.motion = 'off'; else delete root.dataset.motion;
    $('#motion').setAttribute('aria-pressed', String(off));
    if (save) { try { localStorage.setItem('hlia-motion', off ? 'off' : 'on'); } catch (e) { /* storage can be blocked */ } }
    HLIA.bus.emit('motion', off);
  }

  function init() {
    let savedMotion = null;
    try { savedMotion = localStorage.getItem('hlia-motion'); } catch (e) { /* storage can be blocked */ }
    setMotion(savedMotion === 'off', { save: false });
    $('#motion').addEventListener('click', () => setMotion(document.documentElement.dataset.motion !== 'off'));
    i18n.setLang(i18n.detect(), { silent: true });
    paintIntro(); paintLang(); paintFooter();
    // the sources and method stay on the page in every view
    $('#method-slot').replaceChildren(HLIA.method.build());

    HLIA.wizard.init();
    S.load();
    if (!S.a.residence) {
      const g = S.guessCountry();
      if (g) { S.a.residence = g; S.a.passports = [g]; }
    }

    hero = new HLIA.DotField($('#hero-canvas'), { mode: 'map', twinkle: true, glow: true, mapAnchor: 0.12, onHover: heroHover });

    $('#start').addEventListener('click', start);
    $('#restart').addEventListener('click', restart);
    $$('[data-lang]').forEach((b) => b.addEventListener('click', () => { i18n.setLang(b.dataset.lang); }));
    HLIA.bus.on('lang', () => { paintIntro(); paintLang(); paintFooter(); });
    global.addEventListener('popstate', () => {
      const v = viewFromHash();
      setView(v === 'results' && !canShowResults() ? 'wizard' : v, { push: false });
      if (S.view === 'wizard') HLIA.wizard.open();
      if (S.view === 'results' && HLIA.results) HLIA.results.show();
    });

    // first view: where the visit left off, or the intro
    const v = viewFromHash();
    if (v === 'wizard') { setView('wizard', { push: false }); HLIA.wizard.open(); }
    else if (v === 'results' && canShowResults()) { setView('results', { push: false }); HLIA.results && HLIA.results.show(); }
    else setView('intro', { push: false });
    history.replaceState({ v: S.view }, '', S.view === 'intro' ? location.pathname + location.search : '#/' + S.view);
  }

  HLIA.app = { init, setView, start, reveal, restart };
  init();
})(window);
