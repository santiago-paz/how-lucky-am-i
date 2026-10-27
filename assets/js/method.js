/* The "Sources and method" section. It stays on the page in every view. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el } = HLIA.util;
  const i18n = HLIA.i18n;
  const t = (k, v) => i18n.t(k, v);
  const SRC = HLIA.SOURCES;

  function block(hk, pk) { return el('div', { class: 'x-block' }, el('h3', null, t(hk)), el('p', { class: 'read' }, t(pk))); }

  function build() {
    const groups = [
      ['pip', 'pipLines', 'gwwc', 'wir', 'milanovic', 'clemens'],
      ['ubs', 'ubs2022', 'findex'],
      ['wdi', 'wgi', 'uhc', 'hdr', 'edstats', 'wic', 'ilo', 'gallup'],
      ['passport', 'henley', 'blocs', 'gossling'],
      ['jmp', 'sdg7', 'itu', 'fao', 'uhcgmr', 'unesco', 'unhabitat', 'freedom'],
      ['wpp', 'prb', 'indec', 'fx', 'geo', 'three'],
    ];
    const item = (id) => {
      const s = SRC[id];
      return el('li', { class: 'src' },
        // titles and credits are kept in the source's own language (English), so a screen reader on the Spanish page says them right
        el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', lang: 'en' }, s.name),
        el('p', { class: 'src-by', lang: 'en' }, `${s.by}, ${s.when}`),
        el('p', { class: 'src-use' }, s[i18n.lang] || s.en),
        el('p', { class: 'small' }, el('em', { class: 'src-status s-' + s.status }, t('src.status.' + s.status))));
    };
    const limits = el('ul', { class: 'x-limits', role: 'list' }, ...['x.l1', 'x.l2', 'x.l3', 'x.l4', 'x.l5', 'x.l6', 'x.l7'].map((k) => el('li', null, t(k))));
    return el('section', { id: 'method', class: 'r-scene method', 'aria-labelledby': 'method-t' }, el('div', { class: 'wrap' },
      el('header', { class: 'r-head' }, el('h2', { id: 'method-t' }, t('x.title')), el('p', { class: 'read' }, t('x.intro'))),
      el('div', { class: 'x-cols' },
        el('div', { class: 'x-col' },
          block('x.s1', 'x.s1.p1'), block('x.s2', 'x.s2.p1'),
          block('x.income.h', 'x.income.p'), block('x.wealth.h', 'x.wealth.p'), block('x.mobility.h', 'x.mobility.p'), block('x.health.h', 'x.health.p'),
          block('x.education.h', 'x.education.p'), block('x.basics.h', 'x.basics.p'), block('x.safety.h', 'x.safety.p'), block('x.stability.h', 'x.stability.p'),
          block('x.combine.h', 'x.combine.p'), block('x.people.h', 'x.people.p'),
          el('div', { class: 'x-block' }, el('h3', null, t('x.limits')), limits),
          block('x.privacy', 'x.privacy.p')),
        el('div', { class: 'x-col x-sources' },
          el('h3', null, t('x.list')),
          ...groups.map((ids) => el('ul', { class: 'src-list', role: 'list' }, ...ids.map(item))),
          el('p', { class: 'small' }, t('x.rights'))))));
  }
  HLIA.method = { build };
  HLIA.bus.on('lang', () => { const slot = document.getElementById('method-slot'); if (slot) slot.replaceChildren(build()); });
})(window);
