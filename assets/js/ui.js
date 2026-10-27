/* Interface building blocks: icons, tooltip, info popover, combobox, choice groups, money input, stepper.
   Everything returns a DOM node. Text coming from data is always set with textContent. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el, svg, clamp, fmt } = HLIA.util;
  const t = (...a) => HLIA.i18n.t(...a);

  // ---------- icons (24px grid, stroked) ----------
  const ICONS = {
    water: 'M12 3.2c3.3 4.2 5.8 7.2 5.8 10.1a5.8 5.8 0 0 1-11.6 0c0-2.9 2.5-5.9 5.8-10.1Z',
    toilet: 'M7 3.5h10v4.5H7zM4.5 11h15c0 4.2-3 7-7.5 7s-7.5-2.800-7.500-7ZM9 18v2.800h6V18',
    power: 'M13 2.500 5.500 13.500h5.200L10 21.500l8.500-11.500h-5.400L13 2.500Z',
    cooking: 'M12 3c1 3.200 4.800 5 4.800 9.400a4.800 4.800 0 0 1-9.600 0c0-1.900.9-3.100 1.900-4.200.2 1.100.8 1.900 1.500 2.200C10.300 8.200 10.800 5.600 12 3Z',
    internet: 'M3.500 9.200a12 12 0 0 1 17 0M6.500 12.400a7.700 7.700 0 0 1 11 0M9.400 15.500a3.500 3.500 0 0 1 5.200 0M12 18.800h.01',
    food: 'M3.500 11h17a8.500 8.500 0 0 1-17 0ZM8.500 3.500c0 2 1 2 1 4M12.500 3.500c0 2 1 2 1 4M16.500 3.500c0 2 1 2 1 4',
    housing: 'M4 11.200 12 4l8 7.200V20H4v-8.800ZM9.500 20v-5.500h5V20',
    plane: 'M21 12.500 14 10 9 3.500 7.500 4.500l2.500 6.500-4.500.500-1.500-2-1.500.500L3.500 14l-.500 3.500 1.500.500 1.500-2 4.500.500-2.500 6.500 1.500 1L14 18l7-2.500v-3Z',
    people: 'M9 11a3.200 3.200 0 1 0 0-6.400A3.200 3.200 0 0 0 9 11ZM2.800 19.500c.4-3.200 3-5 6.200-5s5.800 1.800 6.200 5M16.500 5.200a3 3 0 0 1 0 5.800M18 14.800c1.800.6 2.900 2.200 3.200 4.500',
    heart: 'M12 20.500S3.500 15.300 3.500 9.200A4.600 4.600 0 0 1 12 6.800a4.600 4.600 0 0 1 8.500 2.400c0 6.100-8.500 11.300-8.500 11.300Z',
    school: 'M12 4 2.500 9 12 14l9.500-5L12 4ZM6 11.500v4.300c0 1.200 2.700 2.700 6 2.700s6-1.500 6-2.700v-4.300M21.500 9v5.500',
    shield: 'M12 3.200 4.500 6v5.500c0 4.700 3.100 8 7.500 9.300 4.400-1.300 7.500-4.600 7.500-9.300V6L12 3.200Z',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.500 12h17M12 3c2.600 2.700 3.800 5.700 3.800 9S14.600 18.300 12 21c-2.600-2.700-3.800-5.700-3.800-9S9.400 5.700 12 3Z',
    coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM14.800 9.200c-.5-.9-1.500-1.400-2.800-1.400-1.600 0-2.800.8-2.800 2.100 0 3 5.800 1.400 5.800 4.400 0 1.300-1.200 2.200-3 2.200-1.400 0-2.500-.6-3-1.600M12 6v1.800M12 16.400V18',
    key: 'M8.500 14.500a4 4 0 1 1 3-1.300L20 21M16 17l2.500 2.500M13.500 14.500 15 16',
    dice: 'M5.500 4h13a1.500 1.500 0 0 1 1.500 1.500v13a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 18.500v-13A1.500 1.500 0 0 1 5.500 4ZM8.700 8.700h.01M15.300 8.700h.01M12 12h.01M8.700 15.300h.01M15.300 15.300h.01',
    share: 'M12 3.500v12M7.500 8 12 3.500 16.500 8M5 13.500v5a1.500 1.500 0 0 0 1.500 1.500h11a1.500 1.500 0 0 0 1.500-1.500v-5',
    download: 'M12 3.500v12M7.500 11 12 15.500 16.500 11M5 19.500h14',
    check: 'M5 12.500 10 17.500 19.500 7',
    search: 'M10.500 17a6.500 6.500 0 1 0 0-13 6.500 6.500 0 0 0 0 13ZM15.500 15.500 20.500 20.500',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    refresh: 'M20 12a8 8 0 1 1-2.500-5.800M20 4v4.500h-4.500',
    play: 'M8 5.500v13l10.500-6.500L8 5.500Z',
    table: 'M4 5.500h16v13H4zM4 10h16M4 14.200h16M9.500 5.500v13',
  };
  function icon(name, size) {
    const s = svg('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' });
    if (size) { s.setAttribute('width', size); s.setAttribute('height', size); }
    s.appendChild(svg('path', { d: ICONS[name] || '' }));
    return s;
  }

  // ---------- one shared tooltip ----------
  const tipEl = el('div', { class: 'tip', role: 'tooltip', id: 'tip' });
  const tip = {
    show(content, x, y) {
      tipEl.replaceChildren(...[].concat(content));
      tipEl.classList.add('on');
      this.move(x, y);
    },
    move(x, y) {
      const pad = 14;
      const r = tipEl.getBoundingClientRect();
      let left = x + pad, top = y - r.height - pad;
      if (left + r.width > innerWidth - 8) left = x - r.width - pad;
      if (left < 8) left = 8;
      if (top < 8) top = y + pad;
      tipEl.style.transform = '';
      tipEl.style.left = left + 'px';
      tipEl.style.top = top + 'px';
    },
    hide() { tipEl.classList.remove('on'); },
  };
  document.body.appendChild(tipEl);

  // ---------- a polite announcer for screen readers ----------
  const live = el('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true', id: 'live' });
  document.body.appendChild(live);
  let liveTimer;
  const say = (msg) => { clearTimeout(liveTimer); liveTimer = setTimeout(() => { live.textContent = msg; }, 350); };

  // ---------- (i) info popover ----------
  // info({ title, text, rows: [[label, value | node]], links: [{label, url}] })
  let openPop = null;
  function closePop(returnFocus) {
    if (!openPop) return;
    openPop.pop.hidden = true;
    openPop.btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) openPop.btn.focus();
    openPop = null;
  }
  document.addEventListener('click', (e) => { if (openPop && !openPop.wrap.contains(e.target)) closePop(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(true); });
  function info({ title, text, rows = [], links = [], label }) {
    const id = 'pop-' + Math.random().toString(36).slice(2, 8);
    const pop = el('div', { class: 'info-pop', id, role: 'group', 'aria-label': title, hidden: true },
      el('h4', null, title),
      text ? el('p', null, text) : null,
      rows.length ? el('dl', null, ...rows.flatMap(([k, v]) => [el('dt', null, k), el('dd', null, v)])) : null,
      links.length ? el('p', { style: { marginTop: '0.7rem' } }, ...links.flatMap((l, i) => [i ? ' ' : null, el('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label)])) : null,
    );
    const btn = el('button', { type: 'button', class: 'info', 'aria-expanded': 'false', 'aria-controls': id, 'aria-label': label || t('info.label') }, 'i');
    const wrap = el('span', { class: 'info-wrap' }, btn, pop);
    btn.addEventListener('click', () => {
      if (openPop && openPop.btn === btn) { closePop(false); return; }
      closePop(false);
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      // keep the popover on screen
      const r = pop.getBoundingClientRect();
      if (r.left < 8) { pop.style.right = 'auto'; pop.style.left = '0'; }
      openPop = { wrap, btn, pop };
    });
    return wrap;
  }

  // ---------- combobox ----------
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // options: [{ id, label, alt, sub }]. Single value: opts.value (id). Multiple: opts.values (ids).
  function combobox(opts) {
    const id = opts.id || 'cb-' + Math.random().toString(36).slice(2, 7);
    const listId = id + '-list';
    let options = opts.options;
    let values = opts.multiple ? (opts.values || []).slice() : opts.value != null ? [opts.value] : [];
    let active = -1;
    let shown = [];
    const input = el('input', {
      class: 'input', id, type: 'text', role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': listId,
      autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: opts.placeholder || '',
    });
    const list = el('ul', { class: 'combo-list', id: listId, role: 'listbox', hidden: true, 'aria-label': opts.label || '' });
    const chips = opts.multiple ? el('div', { class: 'chips' }) : null;
    const wrap = el('div', { class: 'combo' }, input, list);
    const root = el('div', { class: 'combo-root', style: { display: 'grid', gap: '0.6rem' } }, opts.multiple ? chips : null, wrap);
    const byId = () => Object.fromEntries(options.map((o) => [o.id, o]));

    function labelOf(v) { const o = byId()[v]; return o ? o.label : ''; }
    function syncInput() { if (!opts.multiple) input.value = values.length ? labelOf(values[0]) : ''; }
    function renderChips() {
      if (!chips) return;
      chips.replaceChildren(...values.map((v) => el('span', { class: 'chip' }, labelOf(v),
        el('button', { type: 'button', 'aria-label': t('q.passports.remove', { country: labelOf(v) }), onclick: () => { values = values.filter((x) => x !== v); renderChips(); opts.onChange && opts.onChange(values.slice()); } }, '×'))));
    }
    function open() {
      const q = norm(input.value.trim());
      const single = !opts.multiple;
      // when a value is already chosen and the field is untouched, show the whole list
      const filterText = single && values.length && input.value === labelOf(values[0]) ? '' : q;
      shown = options.filter((o) => (!opts.multiple || !values.includes(o.id)) && (!filterText || norm(o.label).includes(filterText) || (o.alt && norm(o.alt).includes(filterText)) || o.id.toLowerCase() === filterText));
      if (filterText) shown.sort((a, b) => (norm(a.label).startsWith(filterText) ? 0 : 1) - (norm(b.label).startsWith(filterText) ? 0 : 1));
      list.replaceChildren(...(shown.length ? shown.slice(0, 120).map((o, i) => el('li', { class: 'combo-opt', role: 'option', id: `${id}-o${i}`, 'aria-selected': 'false', 'data-i': i }, el('span', null, o.label), o.sub ? el('small', null, o.sub) : null)) : [el('li', { class: 'combo-empty', role: 'presentation' }, t('combo.none'))]));
      active = shown.length ? 0 : -1;
      mark();
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function mark() {
      Array.from(list.children).forEach((li, i) => li.setAttribute('aria-selected', i === active ? 'true' : 'false'));
      if (active >= 0) {
        const li = list.children[active];
        input.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function choose(i) {
      const o = shown[i];
      if (!o) return;
      if (opts.multiple) { if (!values.includes(o.id)) values.push(o.id); input.value = ''; renderChips(); }
      else { values = [o.id]; input.value = o.label; }
      close();
      opts.onChange && opts.onChange(opts.multiple ? values.slice() : o.id);
    }
    input.addEventListener('focus', () => { if (!opts.multiple) input.select(); open(); });
    input.addEventListener('click', () => { if (list.hidden) open(); });
    input.addEventListener('input', open);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); else { active = Math.min(shown.length - 1, active + 1); mark(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); mark(); }
      else if (e.key === 'Enter') { if (!list.hidden && active >= 0) { e.preventDefault(); choose(active); } }
      else if (e.key === 'Escape') { if (!list.hidden) { e.stopPropagation(); close(); syncInput(); } }
      else if (e.key === 'Backspace' && opts.multiple && !input.value && values.length) { values.pop(); renderChips(); opts.onChange && opts.onChange(values.slice()); }
    });
    input.addEventListener('blur', () => setTimeout(() => { close(); syncInput(); }, 120));
    list.addEventListener('pointerdown', (e) => { e.preventDefault(); const li = e.target.closest('.combo-opt'); if (li) choose(+li.dataset.i); });
    list.addEventListener('pointermove', (e) => { const li = e.target.closest('.combo-opt'); if (li) { active = +li.dataset.i; mark(); } });

    syncInput(); renderChips();
    root.input = input;
    root.get = () => (opts.multiple ? values.slice() : values[0] ?? null);
    root.set = (v) => { values = opts.multiple ? (v || []).slice() : v != null ? [v] : []; syncInput(); renderChips(); };
    root.setOptions = (o) => { options = o; syncInput(); renderChips(); };
    return root;
  }

  // ---------- radio-style choice cards ----------
  // choices({ name, options: [{ value, label, desc }], value, onChange, cols })
  function choices({ name, options, value, onChange, cols, className }) {
    const group = el('div', { class: 'choices' + (cols ? ' cols-' + cols : '') + (className ? ' ' + className : ''), role: 'radiogroup' });
    options.forEach((o) => {
      const input = el('input', { type: 'radio', name, value: o.value });
      if (o.value === value) input.checked = true;
      input.addEventListener('change', () => onChange && onChange(o.value));
      group.appendChild(el('label', { class: 'choice' }, input, el('b', null, o.label), o.desc ? el('small', null, o.desc) : null));
    });
    group.set = (v) => { group.querySelectorAll('input').forEach((i) => { i.checked = i.value === v; }); };
    return group;
  }
  // toggles({ options: [{ key, label, desc, icon }], values: {key: bool}, onChange })
  function toggles({ options, values, onChange }) {
    const group = el('div', { class: 'choices' });
    options.forEach((o) => {
      const input = el('input', { type: 'checkbox', name: o.key });
      input.checked = !!values[o.key];
      input.addEventListener('change', () => onChange && onChange(o.key, input.checked));
      group.appendChild(el('label', { class: 'toggle' }, input, el('span', { class: 'ico' }, icon(o.icon)), el('b', null, o.label), el('small', null, o.desc)));
    });
    group.setAll = (v) => group.querySelectorAll('input').forEach((i) => { i.checked = v; });
    return group;
  }

  // ---------- stepper ----------
  function stepper({ min = 0, max = 20, value = 0, onChange, label }) {
    let v = value;
    const out = el('output', { 'aria-live': 'polite' }, String(v));
    const dec = el('button', { type: 'button', 'aria-label': t('stepper.less', { name: label }) }, icon('minus'));
    const inc = el('button', { type: 'button', 'aria-label': t('stepper.more', { name: label }) }, icon('plus'));
    const root = el('div', { class: 'stepper', role: 'group', 'aria-label': label }, dec, out, inc);
    const paint = () => { out.textContent = String(v); dec.disabled = v <= min; inc.disabled = v >= max; };
    dec.addEventListener('click', () => { v = Math.max(min, v - 1); paint(); onChange && onChange(v); });
    inc.addEventListener('click', () => { v = Math.min(max, v + 1); paint(); onChange && onChange(v); });
    paint();
    root.set = (x) => { v = clamp(x, min, max); paint(); };
    return root;
  }

  // ---------- money input with currency, period and a log slider ----------
  // The slider works in US dollars a month on a log scale ($20 to $40,000) so it means the same
  // thing in every currency. The text box shows the amount in the chosen currency and period.
  const S_MIN = 20, S_MAX = 40000;
  const usdFromPos = (p) => S_MIN * Math.pow(S_MAX / S_MIN, p / 1000);
  const posFromUsd = (u) => clamp(Math.round((Math.log(Math.max(u, S_MIN) / S_MIN) / Math.log(S_MAX / S_MIN)) * 1000), 0, 1000);
  function niceRound(x) { if (!isFinite(x) || x === 0) return 0; const m = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1); return Math.round(x / m) * m; }
  function parseAmount(str) {
    let s = String(str).replace(/[^\d.,-]/g, '');
    if (!s) return null;
    const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    if (lastDot >= 0 && lastComma >= 0) {
      const dec = lastDot > lastComma ? '.' : ',';
      s = s.replace(dec === '.' ? /,/g : /\./g, '').replace(dec, '.');
    } else if (lastDot >= 0 || lastComma >= 0) {
      const sep = lastDot >= 0 ? '.' : ',';
      const parts = s.split(sep);
      // "1.234" or "1,234,567" read as thousands; "12,5" as a decimal
      if (parts.length > 2 || (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parts[0] !== '0')) s = parts.join('');
      else s = parts.join('.');
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  // ctx: { fx() -> local per USD, eur() -> EUR per USD, localCode() -> 'ARS' }
  function moneyInput({ state, ctx, onChange, withSlider = true, idPrefix = 'inc' }) {
    // state: { amount, currency: 'LOCAL'|'USD'|'EUR', period: 'month'|'year' }  (mutated)
    const rate = () => (state.currency === 'LOCAL' ? ctx.fx() : state.currency === 'EUR' ? ctx.eur() : 1);
    const perFactor = () => (state.period === 'year' ? 12 : 1);
    const code = () => (state.currency === 'LOCAL' ? ctx.localCode() : state.currency);
    const toUsdMonth = (amt) => amt / rate() / perFactor();
    const fromUsdMonth = (u) => u * rate() * perFactor();

    const input = el('input', { class: 'input input-num', id: idPrefix + '-amount', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-describedby': idPrefix + '-hint' });
    const cur = el('span', { class: 'cur', 'aria-hidden': 'true' }, code());
    const prefix = el('div', { class: 'prefix' }, cur, input);
    const slider = withSlider ? el('input', { type: 'range', class: 'range', min: '0', max: '1000', step: '1', id: idPrefix + '-slider', 'aria-label': t('q.income.slider') }) : null;
    const ticks = withSlider ? el('div', { class: 'ticks', 'aria-hidden': 'true' }) : null;

    const currencyBtns = el('div', { class: 'seg', role: 'group', 'aria-label': t('q.currency') });
    const periodBtns = el('div', { class: 'seg', role: 'group', 'aria-label': t('q.period.month') + ' / ' + t('q.period.year') });

    function paintSeg() {
      const list = [['LOCAL', t('q.currency.local', { code: ctx.localCode() })], ['USD', 'USD'], ['EUR', 'EUR']]
        .filter(([k]) => !(k !== 'LOCAL' && ctx.localCode() === k));
      if (!list.find(([k]) => k === state.currency)) state.currency = 'LOCAL';
      currencyBtns.replaceChildren(...list.map(([k, label]) => el('button', { type: 'button', 'aria-pressed': String(state.currency === k), onclick: () => switchCurrency(k) }, label)));
      periodBtns.replaceChildren(...[['month', t('q.period.month')], ['year', t('q.period.year')]].map(([k, label]) => el('button', { type: 'button', 'aria-pressed': String(state.period === k), onclick: () => switchPeriod(k) }, label)));
      cur.textContent = code();
    }
    function paintTicks() {
      if (!ticks) return;
      const marks = [50, 200, 1000, 5000, 20000];
      ticks.replaceChildren(...marks.map((u) => el('span', null, compactMoney(fromUsdMonth(u)))));
    }
    function compactMoney(x) { return fmt.compact(Math.round(x)); }
    function paintAmount(commit) {
      input.value = state.amount != null ? fmt.int(state.amount) : '';
      if (slider) {
        const u = state.amount != null ? toUsdMonth(state.amount) : S_MIN;
        const p = posFromUsd(u);
        slider.value = String(p);
        slider.style.setProperty('--fill', (p / 10) + '%');
        slider.setAttribute('aria-valuetext', state.amount != null ? `${fmt.int(state.amount)} ${code()}` : '');
      }
      if (commit && onChange) onChange();
    }
    function switchCurrency(k) {
      if (k === state.currency) return;
      const u = state.amount != null ? toUsdMonth(state.amount) : null;
      state.currency = k;
      state.amount = u != null ? niceRound(fromUsdMonth(u)) : null;
      paintSeg(); paintTicks(); paintAmount(true);
    }
    function switchPeriod(k) {
      if (k === state.period) return;
      const u = state.amount != null ? toUsdMonth(state.amount) : null;
      state.period = k;
      state.amount = u != null ? niceRound(fromUsdMonth(u)) : null;
      paintSeg(); paintTicks(); paintAmount(true);
    }
    input.addEventListener('input', () => {
      const v = parseAmount(input.value);
      state.amount = v != null && v >= 0 ? v : null;
      if (slider) {
        const p = state.amount != null ? posFromUsd(toUsdMonth(state.amount)) : 0;
        slider.value = String(p); slider.style.setProperty('--fill', (p / 10) + '%');
      }
      onChange && onChange();
    });
    input.addEventListener('blur', () => { input.value = state.amount != null ? fmt.int(state.amount) : ''; });
    if (slider) slider.addEventListener('input', () => {
      const p = +slider.value;
      state.amount = niceRound(fromUsdMonth(usdFromPos(p)));
      slider.style.setProperty('--fill', (p / 10) + '%');
      input.value = fmt.int(state.amount);
      onChange && onChange();
    });

    const root = el('div', { class: 'money' },
      el('div', { class: 'money-tools' }, currencyBtns, periodBtns),
      prefix,
      slider ? el('div', null, slider, ticks) : null,
    );
    root.refresh = () => { paintSeg(); paintTicks(); paintAmount(false); };
    root.input = input;
    root.refresh();
    return root;
  }

  HLIA.ui = { icon, ICONS, tip, say, info, combobox, choices, toggles, stepper, moneyInput, parseAmount, niceRound, norm, closePop };
})(window);
