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
  // who made it, and where the code is
  const LINKEDIN = 'https://www.linkedin.com/in/santiago-paz', REPO = 'https://github.com/santiago-paz/how-lucky-am-i';
  function paintFooter() {
    const out = (href, text) => el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
    $('#foot').replaceChildren(
      el('p', null, t('foot.privacy')),
      el('p', null, t('foot.data')),
      el('p', { class: 'foot-links' }, el('span', null, t('foot.by')), out(LINKEDIN, 'LinkedIn'), out(REPO, t('foot.repo'))),
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
    // a new view starts at the top at once; the page's smooth scrolling would sweep past the whole report on the way
    scrollTo({ top: 0, behavior: 'instant' });
    S.save();
    if (v === 'intro' && hero) hero.render();
  }
  // Each move below replaces the page the visitor was on, and the button they pressed goes with it. Focus follows
  // them to the new heading, so a keyboard or screen reader user is not left at the top of a page they have left.
  function start() {
    setView('wizard');
    HLIA.wizard.open({ focus: true });
  }
  async function reveal() {
    setView('results');
    if (!HLIA.results) return;
    await HLIA.results.show();
    HLIA.results.handOff();
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
    $('#intro-title').focus({ preventScroll: true });
  }

  function viewFromHash() {
    const m = /^#\/(wizard|results)$/.exec(location.hash);
    if (m) return m[1];
    // an in-page link (a nav tab) is not a route: a reload keeps the view the visit was in
    return location.hash && S.view === 'results' ? 'results' : 'intro';
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
      // an in-page link (a nav tab, "skip to the content") is not a change of view: the browser scrolls and the page stays
      if (location.hash && !/^#\/(wizard|results)$/.test(location.hash)) return;
      const v = viewFromHash();
      const target = v === 'results' && !canShowResults() ? 'wizard' : v;
      // Back from a section link lands on the same report that is already on screen: the browser restores the scroll, nothing is rebuilt
      if (target === S.view) return;
      setView(target, { push: false });
      // Back and Forward replace the page like a button does, so focus follows to the new heading here too
      if (S.view === 'intro') $('#intro-title').focus({ preventScroll: true });
      if (S.view === 'wizard') HLIA.wizard.open({ focus: true });
      if (S.view === 'results' && HLIA.results) HLIA.results.show().then(HLIA.results.handOff);
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
