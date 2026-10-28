/* The five-step form and the live estimate beside it. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el, fmt, tween, clamp, $ } = HLIA.util;
  const ui = HLIA.ui;
  const S = HLIA.state;
  const model = HLIA.model;
  const i18n = HLIA.i18n;
  const t = (k, v) => i18n.t(k, v);
  const TOTAL = 5;

  const refs = {};
  let root, stepsWrap, progressEl, navBack, navNext, hudEl;
  let hudShown = null; // the number the live estimate currently shows
  let hudLower = null; // which wording it uses now: "ahead of X%" (true) or "top X%" (false)
  let hudTween = null;
  let hudSay;
  let askEl = null; // the question under the home list while it is open (see askBasics)

  // text with {name} slots filled by nodes or strings
  function node(key, vars) {
    const parts = t(key).split(/(\{\w+\})/);
    return parts.map((p) => {
      const m = /^\{(\w+)\}$/.exec(p);
      if (!m) return p;
      const v = vars[m[1]];
      return v instanceof Node ? v : String(v);
    });
  }

  function countryOptions() {
    return model.countries
      .map((c) => ({ id: c.id, label: i18n.countryName(c), alt: i18n.countryAlt(c) + ' ' + c.iso2 + ' ' + c.id }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.lang));
  }

  // ---------- form helpers ----------
  // Whole sentences, so a narrow screen breaks a short note between them and never inside one.
  const sentences = (s) => (s.match(/[^.!?]+[.!?]*/g) || [s]).map((x) => x.trim());
  function block({ label, hint, control, id, legend, optional, priv }) {
    const hintEl = hint ? el('p', { class: 'hint', id: id + '-hint' }, hint) : null;
    // priv: the reassurance under a question that feels personal, a small lock and one line
    const privEl = priv ? el('p', { class: 'hint hint-private', id: id + '-priv' }, ui.icon('lock'), el('span', null, ...sentences(priv).flatMap((s, i) => [i ? ' ' : null, el('span', { class: 'sent' }, s)]))) : null;
    const described = [hintEl && id + '-hint', privEl && id + '-priv'].filter(Boolean).join(' ') || null;
    const err = el('p', { class: 'err', id: id + '-err', role: 'alert' });
    const text = optional ? [label, el('span', { class: 'opt' }, ' ' + t('optional'))] : label;
    const head = legend ? el('legend', { class: 'field-label' }, text) : el('label', { class: 'field-label', for: id }, text);
    const wrap = legend
      ? el('fieldset', { class: 'field fieldset', 'aria-describedby': described }, head, hintEl, privEl, control, err)
      : el('div', { class: 'field' }, head, hintEl, privEl, control, err);
    // a plain field points its input at the hint and the note (the money input's own pointer named an id that does not exist)
    if (privEl && !legend) { const input = wrap.querySelector('[id="' + id + '"]'); input && input.setAttribute('aria-describedby', described); }
    wrap.setError = (msg) => { err.textContent = msg || ''; wrap.classList.toggle('bad', !!msg); };
    return wrap;
  }
  function sw({ label, checked, onChange, id }) {
    const input = el('input', { type: 'checkbox', role: 'switch', id });
    input.checked = !!checked;
    input.addEventListener('change', () => onChange(input.checked));
    return el('label', { class: 'switch', for: id }, input, el('span', { class: 'track', 'aria-hidden': 'true' }), el('span', { class: 'switch-text' }, label));
  }
  const lbl = (prefix, v) => t(`${prefix}.${v}`);
  const optionsFor = (prefix, values, withDesc = true) => values.map((v) => ({ value: v, label: lbl(prefix, v), desc: withDesc && i18n.has(`${prefix}.${v}.d`) ? t(`${prefix}.${v}.d`) : null }));

  // ---------- context for the money input ----------
  const residenceCountry = () => model.byId[S.a.residence];
  const moneyCtx = {
    fx: () => (residenceCountry() && residenceCountry().fx) || 1,
    eur: () => HLIA.DATA.meta.eurPerUsd,
    // a country with no exchange rate (North Korea) offers US dollars as its "local" money
    localCode: () => (residenceCountry() && residenceCountry().fx ? residenceCountry().cur : 'USD'),
  };

  // ---------- steps ----------
  function step1() {
    const a = S.a;
    const opts = countryOptions();
    refs.residence = ui.combobox({
      id: 'f-residence', options: opts, value: a.residence, placeholder: t('q.residence.ph'), label: t('q.residence'),
      onChange(id) {
        a.residence = id;
        S.residenceTouched = true; // picked from the list, even if it is the same country: no longer only the browser's guess
        if (!S.passportsTouched) { a.passports = S.birthId() ? [S.birthId()] : []; refs.passports.set(a.passports); }
        refs.income && refs.income.refresh();
        update();
      },
    });
    refs.residenceBlock = block({ id: 'f-residence', label: t('q.residence'), control: refs.residence });

    refs.birthCombo = ui.combobox({
      id: 'f-birth', options: opts, value: a.birth, placeholder: t('q.residence.ph'), label: t('q.birth'),
      onChange(id) { a.birth = id; if (!S.passportsTouched) { a.passports = [id]; refs.passports.set(a.passports); } update(); },
    });
    refs.birthBlock = block({ id: 'f-birth', label: t('q.birth'), control: refs.birthCombo });
    refs.birthBlock.hidden = a.sameBirth;
    const bornHere = sw({
      id: 'f-same', label: t('q.bornHere'), checked: a.sameBirth,
      onChange(v) {
        a.sameBirth = v;
        refs.birthBlock.hidden = v;
        if (!S.passportsTouched) { a.passports = S.birthId() ? [S.birthId()] : []; refs.passports.set(a.passports); }
        update();
      },
    });

    refs.passports = ui.combobox({
      id: 'f-passports', options: opts, multiple: true, values: a.passports, placeholder: t('q.passports.ph'), label: t('q.passports'),
      onChange(values) { a.passports = values; S.passportsTouched = true; update(); },
    });
    refs.passportsBlock = block({ id: 'f-passports', label: t('q.passports'), hint: t('q.passports.hint'), control: refs.passports });

    refs.statusBlock = block({
      id: 'f-status', legend: true, label: t('q.status'), priv: t('q.private'),
      control: ui.choices({ name: 'status', options: optionsFor('q.status', ['citizen', 'permanent', 'temporary', 'insecure']), value: a.status, onChange(v) { a.status = v; update(); } }),
    });

    const year = el('input', { class: 'input input-num', id: 'f-year', type: 'text', inputmode: 'numeric', maxlength: '4', placeholder: '1992', autocomplete: 'off', style: { maxWidth: '9rem' } });
    year.value = a.birthYear || '';
    year.addEventListener('input', () => { const v = parseInt(year.value.replace(/\D/g, ''), 10); a.birthYear = Number.isFinite(v) ? v : null; refs.yearBlock.setError(''); S.save(); });
    refs.yearBlock = block({ id: 'f-year', label: t('q.birthYear'), hint: t('q.birthYear.hint'), control: year, optional: true });
    refs.year = year;

    return [refs.residenceBlock, bornHere, refs.birthBlock, refs.passportsBlock, refs.statusBlock, refs.yearBlock];
  }

  function step2() {
    const a = S.a;
    refs.workBlock = block({
      id: 'f-work', legend: true, label: t('q.work'),
      control: ui.choices({ name: 'work', options: optionsFor('q.work', ['formal', 'selfstable', 'informal', 'none']), value: a.workType, onChange(v) { a.workType = v; refs.workBlock.setError(''); update(); } }),
    });

    refs.reads = el('div', { class: 'reads', 'aria-live': 'polite' });
    // when currency or period change, the household amount is rescaled by the same factor
    let last = { cur: a.income.currency, per: a.income.period };
    const rate = (cur) => (cur === 'LOCAL' ? moneyCtx.fx() : cur === 'EUR' ? moneyCtx.eur() : 1);
    const per = (p) => (p === 'year' ? 12 : 1);
    refs.income = ui.moneyInput({
      state: a.income, ctx: moneyCtx, idPrefix: 'inc',
      onChange() {
        if (last.cur !== a.income.currency || last.per !== a.income.period) {
          const f = (rate(a.income.currency) * per(a.income.period)) / (rate(last.cur) * per(last.per));
          if (a.household.total != null) a.household.total = ui.niceRound(a.household.total * f);
          last = { cur: a.income.currency, per: a.income.period };
          refs.hhInput && (refs.hhInput.value = a.household.total != null ? fmt.int(a.household.total) : '');
        }
        refs.incomeBlock.setError('');
        update();
      },
    });
    refs.incomeBlock = block({ id: 'inc-amount', label: t('q.income'), hint: t('q.income.hint'), priv: t('q.private'), control: refs.income });

    const hhWrap = el('div', { class: 'hh' });
    refs.hhInput = el('input', { class: 'input input-num', id: 'hh-total', type: 'text', inputmode: 'decimal', autocomplete: 'off' });
    refs.hhInput.value = a.household.total != null ? fmt.int(a.household.total) : '';
    refs.hhInput.addEventListener('input', () => { const v = ui.parseAmount(refs.hhInput.value); a.household.total = v != null && v >= 0 ? v : null; update(); });
    refs.hhInput.addEventListener('blur', () => { refs.hhInput.value = a.household.total != null ? fmt.int(a.household.total) : ''; });
    refs.adults = ui.stepper({ min: 1, max: 12, value: a.household.adults, label: t('q.adults'), onChange(v) { a.household.adults = v; update(); } });
    refs.children = ui.stepper({ min: 0, max: 12, value: a.household.children, label: t('q.children'), onChange(v) { a.household.children = v; update(); } });
    hhWrap.append(
      block({ id: 'hh-total', label: t('q.household'), hint: t('q.household.hint'), control: refs.hhInput }),
      el('div', { class: 'steppers' },
        el('div', { class: 'field' }, el('span', { class: 'field-label' }, t('q.adults')), refs.adults),
        el('div', { class: 'field' }, el('span', { class: 'field-label' }, t('q.children')), refs.children)),
    );
    hhWrap.hidden = !a.household.shared;
    const shared = sw({ id: 'f-shared', label: t('q.shared'), checked: a.household.shared, onChange(v) { a.household.shared = v; hhWrap.hidden = !v; update(); } });
    const sharedHint = el('p', { class: 'hint', style: { marginTop: '-0.4rem' } }, t('q.shared.hint'));

    return [refs.workBlock, refs.incomeBlock, shared, sharedHint, hhWrap, el('div', { class: 'reads-wrap' }, el('h2', { class: 'reads-title' }, t('reads.title')), refs.reads)];
  }

  function worthRange(key) {
    const c = residenceCountry();
    if (!c || c.cur === 'USD') return '';
    const local = (usd) => c.cur + ' ' + fmt.compact(usd * c.fx);
    return { b0: local(10000), b1: local(10000) + ' - ' + local(100000), b2: local(100000) + ' - ' + local(1000000), b3: local(1000000) }[key] || '';
  }
  function step3() {
    const a = S.a;
    refs.tenureBlock = block({
      id: 'f-tenure', legend: true, label: t('q.tenure'),
      control: ui.choices({ name: 'tenure', options: optionsFor('q.tenure', ['own', 'mortgage', 'rent', 'family', 'insecure']), value: a.tenure, onChange(v) { a.tenure = v; refs.tenureBlock.setError(''); update(); } }),
    });
    refs.savingsBlock = block({
      id: 'f-savings', legend: true, label: t('q.savings'),
      control: ui.choices({ name: 'savings', options: optionsFor('q.savings', ['none', 'lt3', '3to6', 'gt6', 'gt24'], false), value: a.savings, cols: 3, onChange(v) { a.savings = v; refs.savingsBlock.setError(''); update(); } }),
    });

    const worthOpts = ['neg', 'b0', 'b1', 'b2', 'b3'].map((k) => ({
      value: k, label: t(`q.worth.${k}`),
      desc: k === 'neg' ? t('q.worth.neg.d') : worthRange(k) ? t(`q.worth.${k}.d`, { range: worthRange(k) }) : null,
    }));
    const skip = el('button', { type: 'button', class: 'btn btn-quiet', onclick() {
      a.netWorth = { bracket: null, skip: true };
      refs.worth.set(null);
      skip.setAttribute('aria-pressed', 'true');
      update();
    }, 'aria-pressed': String(!!a.netWorth.skip) }, t('q.worth.skip'));
    refs.worth = ui.choices({ name: 'worth', options: worthOpts, value: a.netWorth.bracket, onChange(v) { a.netWorth = { bracket: v, skip: false }; skip.setAttribute('aria-pressed', 'false'); update(); } });
    refs.worthBlock = block({ id: 'f-worth', legend: true, label: t('q.worth'), hint: t('q.worth.hint'), priv: t('q.private'), control: el('div', { class: 'stack' }, refs.worth, skip), optional: true });

    const items = [['water', 'water'], ['toilet', 'toilet'], ['power', 'power'], ['cooking', 'cooking'], ['internet', 'internet'], ['food', 'food']];
    refs.basics = ui.toggles({
      options: items.map(([k, ic]) => ({ key: k, icon: ic, label: t(`basic.${k}`), desc: t(`basic.${k}.d`) })),
      values: a.basics,
      onChange(k, v) { a.basics[k] = v; touchBasics(); update(); },
    });
    const all = el('button', { type: 'button', class: 'btn btn-quiet', onclick() { Object.keys(a.basics).forEach((k) => { a.basics[k] = true; }); refs.basics.setAll(true); touchBasics(); update(); } }, t('q.basics.all'));
    const none = el('button', { type: 'button', class: 'btn btn-quiet', onclick() { Object.keys(a.basics).forEach((k) => { a.basics[k] = false; }); refs.basics.setAll(false); touchBasics(); update(); } }, t('q.basics.none'));
    refs.basicsBlock = block({ id: 'f-basics', legend: true, label: t('q.basics'), hint: t('q.basics.hint'), control: el('div', { class: 'stack' }, el('div', { class: 'row-tools' }, all, none), refs.basics) });

    return [refs.tenureBlock, refs.savingsBlock, refs.worthBlock, refs.basicsBlock];
  }

  function step4() {
    const a = S.a;
    refs.eduBlock = block({
      id: 'f-edu', legend: true, label: t('q.education'),
      control: ui.choices({ name: 'edu', options: optionsFor('q.edu', model.EDU), value: a.education, onChange(v) { a.education = v; refs.eduBlock.setError(''); update(); } }),
    });
    refs.healthBlock = block({
      id: 'f-health', legend: true, label: t('q.health'),
      control: ui.choices({ name: 'health', options: optionsFor('q.health', ['none', 'basic', 'high']), value: a.health, cols: 1, onChange(v) { a.health = v; refs.healthBlock.setError(''); update(); } }),
    });
    return [refs.eduBlock, refs.healthBlock];
  }

  function yesNo(name, key) {
    const a = S.a;
    return ui.choices({
      name, className: 'yesno', options: [{ value: 'yes', label: t('yes') }, { value: 'no', label: t('no') }],
      value: a[key] === true ? 'yes' : a[key] === false ? 'no' : null,
      onChange(v) { a[key] = v === 'yes'; refs[key + 'Block'] && refs[key + 'Block'].setError(''); update(); },
    });
  }
  function step5() {
    const a = S.a;
    refs.travelBlock = block({ id: 'f-travel', legend: true, label: t('q.travel'), hint: t('q.travel.hint'), control: yesNo('travel', 'travel') });
    refs.supportBlock = block({ id: 'f-support', legend: true, label: t('q.support'), control: yesNo('support', 'support') });
    refs.stateBlock = block({
      id: 'f-state', legend: true, label: t('q.state'), hint: t('q.state.hint'),
      control: ui.choices({ name: 'state', options: optionsFor('q.state', ['yes', 'partly', 'no'], false), value: a.stateHelp, cols: 3, onChange(v) { a.stateHelp = v; refs.stateBlock.setError(''); update(); } }),
    });
    refs.startBlock = block({
      id: 'f-start', legend: true, label: t('q.start'), hint: t('q.start.hint'), optional: true,
      control: ui.choices({ name: 'start', options: optionsFor('q.start', ['lower', 'same', 'higher'], false), value: a.start, cols: 3, onChange(v) { a.start = v; update(); } }),
    });
    return [refs.travelBlock, refs.supportBlock, refs.stateBlock, refs.startBlock];
  }

  const BUILDERS = [step1, step2, step3, step4, step5];

  // ---------- live estimate ----------
  function buildHud() {
    const crowd = el('div', { class: 'crowd', role: 'img', 'aria-label': t('hud.crowd') });
    for (let i = 0; i < 100; i++) crowd.appendChild(el('i'));
    const num = el('p', { class: 'hud-num' }, el('span', { class: 'hud-top' }, ''), el('span', { class: 'hud-pct' }, '0'), el('span', { class: 'hud-sym' }, '%'));
    const dims = el('ul', { class: 'hud-dims', role: 'list' }, ...model.DIMENSIONS.map((d) => el('li', { 'data-dim': d.id },
      el('span', { class: 'n' }, t('dim.' + d.id)), el('span', { class: 'b' }, el('i')), el('span', { class: 'v' }))));
    hudEl = el('aside', { class: 'hud', 'aria-label': t('hud.title') },
      el('h2', { class: 'hud-title' }, t('hud.title')),
      el('div', { class: 'hud-body' },
        el('div', { class: 'hud-read' }, num, el('p', { class: 'hud-sub' }, ''), el('p', { class: 'hud-empty' }, t('hud.empty'))),
        crowd),
      el('p', { class: 'hud-count' }, t('hud.counted')),
      dims,
      el('p', { class: 'hud-note' }, t('hud.draft')),
    );
    hudEl.crowd = crowd; hudEl.num = num; hudEl.dims = dims;
    return hudEl;
  }

  function paintCrowd(pct) {
    const dots = hudEl.crowd.children;
    // nobody is placed yet: a plain crowd with no gold one, so it never reads as "you are the very first"
    if (pct < 0) { for (let i = 0; i < 100; i++) dots[i].className = ''; return; }
    const k = clamp(Math.round(pct * 100), 0, 99);
    for (let i = 0; i < 100; i++) dots[i].className = i < k ? 'b' : i === k ? 'y' : 'a';
  }
  // one decimal under 10, none above, and never "100": a place short of everyone is not the whole world
  const pctText = (v) => (v >= 99.5 ? '99.9' : v < 10 ? fmt.dec(v, 1) : fmt.int(Math.round(v)));
  function showNumber(target) {
    const pctEl = hudEl.num.querySelector('.hud-pct');
    if (hudTween) hudTween.cancel(); // a count still running toward the old number must not overwrite the new one
    if (hudShown == null) { pctEl.textContent = pctText(target); hudShown = target; return; }
    const from = hudShown;
    hudTween = tween(500, (e) => {
      const v = from + (target - from) * e;
      pctEl.textContent = pctText(v);
      hudShown = v;
    });
  }
  // what the panel says in place of the number
  function hudEmptyText() {
    const c = model.byId[S.a.residence];
    if (!c) return t('hud.empty');
    return S.guessing() ? t('hud.guess', { country: i18n.countryName(c) }) : t('hud.income');
  }
  function updateHud() {
    if (!hudEl) return;
    const ready = S.ready();
    // Nothing in the panel may rest on a guess: while the country is only the browser's, the panel stays blank.
    const r = S.a.residence && ready.length && !S.guessing() ? S.compute(ready) : null;
    // The place itself waits for income. The country and the passports alone say little about one person.
    const placed = !!r && S.placed();
    hudEl.classList.toggle('empty', !placed);
    hudEl.querySelector('.hud-empty').textContent = hudEmptyText();
    if (placed) hudEl.crowd.removeAttribute('aria-hidden'); else hudEl.crowd.setAttribute('aria-hidden', 'true'); // its label names a gold one
    hudEl.dims.querySelectorAll('li').forEach((li) => {
      const d = r && r.dims.find((x) => x.id === li.dataset.dim);
      li.classList.toggle('on', !!d);
      li.querySelector('.b i').style.transform = `scaleX(${d ? Math.max(0.02, d.global) : 0})`; // a transform, so the bar grows without a layout pass
      li.querySelector('.v').textContent = d ? fmt.int(Math.round(d.global * 100)) + '%' : '';
    });
    if (!placed) { hudShown = null; paintCrowd(-1); return; }
    // the same wording rule as the verdict: "ahead of 25%" when you, or your country's typical person, are in the lower half
    const lower = HLIA.results ? HLIA.results.frameAhead(r) : r.overall.pct < 0.5;
    if (lower !== hudLower) { hudLower = lower; hudShown = null; } // a new wording starts from its own number, not from the old one
    hudEl.num.classList.toggle('ahead', lower);
    hudEl.querySelector('.hud-top').textContent = t(lower ? 'w.ahead' : 'w.top');
    const share = (lower ? r.overall.pct : r.overall.ahead) * 100;
    const shown = share < 10 ? Math.round(share * 10) / 10 : Math.round(share);
    showNumber(shown);
    paintCrowd(r.overall.pct);
    hudEl.querySelector('.hud-sub').textContent = t('hud.ahead', { behind: i18n.people(r.overall.behind) });
    hudSay && hudSay(t('hud.title') + ': ' + t(lower ? 'a.ahead' : 'hud.top', { pct: pctText(shown) }));
  }

  // ---------- "how we read this" ----------
  function updateReads() {
    const box = refs.reads;
    if (!box) return;
    const a = S.a, c = residenceCountry();
    const hhOk = a.household.shared && a.household.total > 0;
    if (!c || !(a.income.amount > 0 || hhOk)) { box.replaceChildren(el('p', { class: 'hint' }, t('reads.none'))); return; }
    const am = S.forModel();
    const inc = model.income(am);
    const usF = model.priceFactor(model.byId.USA, model.nowT()); // prices in the US now versus 2021
    // everything below is per person: income() already divides a shared household by its size
    const lines = [];
    if (inc.people > 1) lines.push(el('p', null, node('reads.usdHH', { n: inc.people, total: el('b', null, i18n.usd(inc.usdMonth * inc.people)), each: el('b', null, i18n.usd(inc.usdMonth)) })));
    else lines.push(el('p', null, node('reads.usd', { usd: el('b', null, i18n.usd(inc.usdMonth)) })));
    lines.push(el('p', null, node('reads.ppp', { ppp: el('b', null, i18n.usd(inc.pppMonth * usF)) })));
    lines.push(el('p', null, node('reads.day', { day: el('b', null, fmt.money(inc.z, 'USD', inc.z < 10 ? 2 : 0)) })));
    if (c.est && (c.est.includes('cpi') || c.est.includes('ppp'))) lines.push(el('p', { class: 'warn' }, t('reads.rough', { country: i18n.countryName(c) })));
    box.replaceChildren(...lines);
  }

  // ---------- flow ----------
  function update() {
    S.save();
    updateHud();
    updateReads();
  }

  function validate(step) {
    const a = S.a;
    let first = null;
    const bad = (blk, msg, focusEl) => { blk.setError(msg); if (!first) first = focusEl || blk; };
    if (step === 1) {
      if (!a.residence) bad(refs.residenceBlock, t('err.country'), refs.residence.input);
      if (!a.sameBirth && !a.birth) bad(refs.birthBlock, t('err.country'), refs.birthCombo.input);
      if (!a.passports.length) bad(refs.passportsBlock, t('err.passport'), refs.passports.input);
      if (a.birthYear != null && (a.birthYear < 1900 || a.birthYear > new Date().getFullYear())) bad(refs.yearBlock, t('err.year'), refs.year);
    } else if (step === 2) {
      if (!a.workType) bad(refs.workBlock, t('err.pick'), refs.workBlock.querySelector('input'));
      const hhOk = a.household.shared && a.household.total > 0;
      if (!(a.income.amount > 0) && !hhOk && a.workType !== 'none') bad(refs.incomeBlock, t('err.income'), refs.income.input);
    } else if (step === 3) {
      if (!a.tenure) bad(refs.tenureBlock, t('err.pick'), refs.tenureBlock.querySelector('input'));
      if (!a.savings) bad(refs.savingsBlock, t('err.pick'), refs.savingsBlock.querySelector('input'));
    } else if (step === 4) {
      if (!a.education) bad(refs.eduBlock, t('err.pick'), refs.eduBlock.querySelector('input'));
      if (!a.health) bad(refs.healthBlock, t('err.pick'), refs.healthBlock.querySelector('input'));
    } else if (step === 5) {
      if (a.travel == null) bad(refs.travelBlock, t('err.pick'), refs.travelBlock.querySelector('input'));
      if (a.support == null) bad(refs.supportBlock, t('err.pick'), refs.supportBlock.querySelector('input'));
      if (!a.stateHelp) bad(refs.stateBlock, t('err.pick'), refs.stateBlock.querySelector('input'));
    }
    if (first) { (first.focus ? first : first.querySelector('input,button'))?.focus(); first.scrollIntoView?.({ block: 'center', behavior: HLIA.util.reducedMotion() ? 'auto' : 'smooth' }); }
    return !first;
  }

  function paintProgress() {
    progressEl.replaceChildren(...Array.from({ length: TOTAL }, (_, i) => {
      const n = i + 1;
      // a phone hides the word beside the number, so the name says it: "Step 2 of 5: Money"
      const name = `${t('wiz.step', { n, total: TOTAL })}: ${t(`wiz.s${n}.short`)}`;
      const b = el('button', { type: 'button', 'aria-label': name, 'aria-current': n === S.step ? 'step' : null, disabled: n > S.maxStep, onclick() { if (n <= S.maxStep) go(n); } },
        el('span', { class: 'n' }, String(n)), el('span', { class: 's' }, t(`wiz.s${n}.short`)));
      return el('li', { class: n < S.step ? 'done' : n === S.step ? 'now' : '' }, b);
    }));
  }
  function paintNav() {
    navBack.hidden = S.step === 1;
    navNext.textContent = S.step === TOTAL ? t('wiz.finish') : t('wiz.next');
    navNext.className = 'btn btn-lg ' + (S.step === TOTAL ? 'btn-gold' : 'btn-primary');
  }
  function go(n, { focus = true } = {}) {
    S.step = clamp(n, 1, TOTAL);
    S.maxStep = Math.max(S.maxStep, S.step);
    if (S.step !== 3) closeAsk();
    Array.from(stepsWrap.children).forEach((s, i) => { s.hidden = i + 1 !== S.step; });
    const cur = stepsWrap.children[S.step - 1];
    cur.classList.remove('enter'); void cur.offsetWidth; cur.classList.add('enter');
    paintProgress(); paintNav();
    S.save();
    if (focus) {
      const top = Math.max(0, root.getBoundingClientRect().top + scrollY - 80);
      // A shorter step shrinks the page, and the browser then clamps the scroll to the footer. Gliding up
      // from there would sweep the whole page past the eye, so a long way is a jump and a short way glides.
      const near = Math.abs(top - scrollY) < innerHeight * 0.9;
      scrollTo({ top, behavior: near && !HLIA.util.reducedMotion() ? 'smooth' : 'instant' });
      const h = cur.querySelector('h1');
      h && h.focus({ preventScroll: true });
    }
    updateReads();
  }
  // ---------- an untouched home list is not "none" ----------
  // The list starts with everything off, so a visitor who skims past it would be counted as having none of it.
  // Next with nothing tapped asks first. Another press of Next, while the question is open, takes the visitor back to it:
  // only its own yes button counts as the answer.
  function closeAsk() {
    if (!askEl) return;
    // a tap elsewhere can close it while focus is still on one of its buttons: keep focus in the list, not at the top of the page
    if (askEl.contains(document.activeElement)) refs.basics.querySelector('input').focus({ preventScroll: true });
    askEl.remove(); askEl = null;
  }
  function touchBasics() { S.basicsTouched = true; closeAsk(); }
  function askBasics() {
    const smooth = () => (HLIA.util.reducedMotion() ? 'auto' : 'smooth');
    const fix = el('button', { type: 'button', class: 'btn btn-ghost', onclick() {
      closeAsk();
      const first = refs.basics.querySelector('input');
      first.scrollIntoView({ block: 'center', behavior: smooth() });
      first.focus({ preventScroll: true });
    } }, t('ask.basics.no'));
    const ok = el('button', { type: 'button', class: 'btn btn-ghost', onclick() { touchBasics(); next(); } }, t('ask.basics.yes'));
    askEl = el('div', { class: 'ask', role: 'alert' }, el('p', null, t('ask.basics')), el('div', { class: 'ask-actions' }, fix, ok));
    refs.basicsBlock.appendChild(askEl);
    askEl.scrollIntoView({ block: 'center', behavior: smooth() });
    fix.focus({ preventScroll: true });
  }
  function next() {
    if (!validate(S.step)) return;
    if (S.step === 3 && !S.basicsTouched) {
      if (!askEl) askBasics();
      else {
        ui.say(t('ask.basics'));
        askEl.scrollIntoView({ block: 'center', behavior: HLIA.util.reducedMotion() ? 'auto' : 'smooth' });
        askEl.querySelector('button').focus({ preventScroll: true });
      }
      return;
    }
    if (S.step === 3) touchBasics();
    if (S.step === TOTAL) { update(); hudSay.cancel(); HLIA.app.reveal(); return; }
    S.maxStep = Math.max(S.maxStep, S.step + 1);
    update();
    go(S.step + 1);
  }

  // ---------- build ----------
  function render() {
    Object.keys(refs).forEach((k) => delete refs[k]);
    askEl = null; // the rebuilt list has no question open
    root.setAttribute('aria-label', t('wiz.label')); // the region name follows the language
    hudSay && hudSay.cancel(); // the panel is rebuilt, and says its own line again
    stepsWrap.replaceChildren(...BUILDERS.map((build, i) => {
      const n = i + 1;
      // a plain block, not a fieldset with a hidden legend: the heading names the step, so a screen reader hears the title once
      return el('div', { class: 'step', 'data-step': n, hidden: n !== S.step },
        el('header', { class: 'step-head' },
          el('h1', { tabindex: '-1' }, t(`wiz.s${n}.title`)),
          el('p', { class: 'read' }, t(`wiz.s${n}.intro`))),
        el('div', { class: 'step-body' }, ...build()));
    }));
    navBack.textContent = t('wiz.back');
    root.querySelector('.hud-slot').replaceChildren(buildHud());
    hudShown = null; hudLower = null;
    paintProgress(); paintNav();
    updateReads(); updateHud();
  }

  function init() {
    root = $('#wizard');
    progressEl = el('ol', { class: 'wiz-progress', role: 'list' });
    stepsWrap = el('form', { class: 'steps', novalidate: true, autocomplete: 'off', onsubmit: (e) => e.preventDefault() });
    navBack = el('button', { type: 'button', class: 'btn btn-ghost btn-lg', onclick: () => go(S.step - 1) }, '');
    navNext = el('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: next }, '');
    const progressNav = el('nav', { 'aria-label': t('wiz.progress') }, progressEl);
    root.replaceChildren(el('div', { class: 'wrap wiz-shell' },
      el('div', { class: 'wiz-main' }, progressNav, stepsWrap, el('div', { class: 'wiz-nav' }, navBack, navNext)),
      el('div', { class: 'hud-slot' })));
    hudSay = debounceSay();
    HLIA.bus.on('lang', (l) => { if (root && !root.hidden) { render(); renderedLang = l; } });
    // keyboard: Enter on a text input moves on
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text' && e.target.getAttribute('role') !== 'combobox') { e.preventDefault(); next(); }
    });
  }
  function debounceSay() {
    let timer;
    const say = (msg) => { clearTimeout(timer); timer = setTimeout(() => ui.say(msg), 1200); };
    say.cancel = () => clearTimeout(timer); // a line still waiting must not be read out over the next page
    return say;
  }

  let renderedLang = null;
  // The report opens on a 3D globe. Its code is fetched while the person answers, so nothing waits when the result comes.
  let warmed = false;
  function warmUp() {
    if (warmed || !HLIA.results || !HLIA.results.load3d) return;
    warmed = true;
    const go = () => HLIA.results.load3d();
    if ('requestIdleCallback' in global) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 1200);
  }
  function open({ focus = false } = {}) {
    if (!stepsWrap.children.length || renderedLang !== i18n.lang) { render(); renderedLang = i18n.lang; }
    go(S.step, { focus: false });
    if (focus) stepsWrap.children[S.step - 1].querySelector('h1').focus({ preventScroll: true }); // the person came from a button that is gone
    warmUp();
  }

  HLIA.wizard = { init, render, open, go, next, update };
})(window);
