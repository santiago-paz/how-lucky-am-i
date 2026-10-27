/* Translations (English and Spanish) and a tiny event bus.
   Static text lives in the HTML with data-i18n attributes. Text built by script calls t(). */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;

  // ---------- event bus ----------
  const handlers = {};
  HLIA.bus = {
    on(name, fn) { (handlers[name] ||= []).push(fn); },
    off(name, fn) { handlers[name] = (handlers[name] || []).filter((h) => h !== fn); },
    emit(name, data) { (handlers[name] || []).forEach((fn) => fn(data)); },
  };

  const dict = { en: {}, es: {} };
  let lang = 'en';

  function add(l, entries) { Object.assign(dict[l], entries); }

  // t('key', { n: 3, name: 'x' }) fills {n} and {name}. If vars.n is set and 'key_one' or
  // 'key_other' exists, the matching form is used.
  function t(key, vars) {
    const d = dict[lang];
    let s = d[key];
    if (vars && vars.n != null) {
      const plural = d[key + (vars.n === 1 ? '_one' : '_other')];
      if (plural != null) s = plural;
    }
    if (s == null) s = dict.en[key];
    if (s == null) return key;
    return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : s;
  }
  const has = (key) => dict[lang][key] != null || dict.en[key] != null;

  function detect() {
    let saved = null;
    try { saved = localStorage.getItem('hlia-lang'); } catch (e) { /* storage can be blocked */ }
    if (saved === 'en' || saved === 'es') return saved;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  // Fill every element that carries a data-i18n* attribute.
  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    // Our own static strings only: they may contain <a>, <strong> and <em>.
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((x) => x.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  function setLang(l, { silent } = {}) {
    if (l !== 'en' && l !== 'es') return;
    lang = l;
    document.documentElement.lang = l;
    HLIA.util.setLocale(l);
    try { localStorage.setItem('hlia-lang', l); } catch (e) { /* ignore */ }
    apply();
    document.title = t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.description'));
    if (!silent) HLIA.bus.emit('lang', l);
  }

  // Country name in the current language.
  const countryName = (c) => (lang === 'es' ? c.es || c.n : c.n);
  const countryAlt = (c) => (lang === 'es' ? c.n : c.es || c.n);

  // "8.2 billion", "840 million", in the current language. Spanish needs "de" between a
  // million-sized number and the noun ("8,2 mil millones de personas"), so the sentence
  // strings put "personas" right after this and the "de" comes from here. Table cells that
  // stand alone ask for the bare form.
  function people(n, { bare = false } = {}) {
    const f = HLIA.util.fmt;
    let s, big = true;
    // non-breaking spaces keep the number and its unit on one line
    if (n >= 1e9) s = f.dec(n / 1e9, 1) + ' ' + t('unit.billion').replace(/ /g, ' ');
    else if (n >= 1e6) s = f.int(n / 1e6) + ' ' + t('unit.million');
    else { s = f.int(n); big = false; }
    return big && !bare && lang === 'es' ? s + ' de' : s;
  }
  // A money amount in US dollars with a compact form for big numbers.
  function usd(n, digits = 0) { return HLIA.util.fmt.money(n, 'USD', digits); }

  HLIA.i18n = { add, t, has, detect, apply, setLang, get lang() { return lang; }, countryName, countryAlt, people, usd };
})(window);
