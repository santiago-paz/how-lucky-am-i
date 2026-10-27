/* The share card: drawn on a canvas, downloadable, shareable. It shows only the overall place.
   Income, savings and other answers never go on it. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el, fmt, clamp } = HLIA.util;
  const i18n = HLIA.i18n;
  const t = (k, v) => i18n.t(k, v);
  const model = HLIA.model;
  const W = 1080, H = 1350;

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function draw(canvas, R, opts) {
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const css = HLIA.util.cssVar;
    const gold = css('--you') || '#ffc14d', emerald = css('--ahead') || '#35d6a0', ink = css('--ink') || '#eef1ff', ink2 = css('--ink-2') || '#b4bce3';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070a1c'); g.addColorStop(1, '#0e1330');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // faint stars
    const rnd = HLIA.util.rng(99);
    for (let i = 0; i < 160; i++) { ctx.globalAlpha = 0.1 + rnd() * 0.3; ctx.fillStyle = '#a397f6'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.62, 0.6 + rnd() * 1.2, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const F = '"Mona Sans", system-ui, sans-serif';
    // wordmark
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = `700 44px ${F}`; ctx.fillStyle = ink; ctx.fillText('How Lucky ', 80, 120);
    const w1 = ctx.measureText('How Lucky ').width; ctx.fillStyle = gold; ctx.fillText('I', 80 + w1, 120);
    const w2 = ctx.measureText('I ').width; ctx.fillStyle = ink; ctx.fillText('Am', 80 + w1 + w2, 120);
    // the number
    const top = HLIA.util.topLabel(R.overall.ahead);
    ctx.fillStyle = ink2; ctx.font = `650 64px ${F}`; ctx.fillText('Top', 80, 330);
    ctx.fillStyle = ink; ctx.font = `800 300px ${F}`;
    const tw = ctx.measureText('Top ').width;
    ctx.font = `650 64px ${F}`; const topW = ctx.measureText('Top').width;
    ctx.font = `800 300px ${F}`; ctx.fillText(top, 80 + topW + 28, 410);
    const numW = ctx.measureText(top).width;
    ctx.font = `700 150px ${F}`; ctx.fillStyle = ink2; ctx.fillText('%', 80 + topW + 28 + numW + 12, 410);
    ctx.font = `500 46px ${F}`; ctx.fillStyle = ink; ctx.fillText(t('s.card.of', { pop: i18n.people(HLIA.DATA.meta.pipPop) }), 80, 490);
    if (opts.country) { ctx.fillStyle = ink2; ctx.font = `500 36px ${F}`; ctx.fillText(i18n.countryName(model.byId[HLIA.state.a.residence]), 80, 545); }

    // the crowd, sorted by income, with you in gold
    const P = HLIA.people;
    const userZ = R.income.z;
    const base = opts.areas ? 900 : 1130, left = 80, plotW = W - 160;
    const B = 70, colW = plotW / B;
    const lo = Math.log10(0.5), hi = Math.log10(1000);
    // the tallest column must stay below the headline, so the dots get smaller as the crowd gets denser
    const binOf = (i) => clamp(Math.floor(((Math.log10(Math.max(P.z[i], 0.01)) - lo) / (hi - lo)) * B), 0, B - 1);
    const cnt = new Uint16Array(B);
    for (let r = 0; r < P.n; r++) cnt[binOf(P.order[r])]++;
    const peak = Math.max(...cnt), avail = base - 610;
    const per = Math.max(3, Math.ceil(Math.sqrt((peak * colW * 0.9) / avail)));
    const d = colW / per, rowH = d * 0.9;
    const fill = new Uint16Array(B);
    for (let r = 0; r < P.n; r++) {
      const i = P.order[r];
      const b = binOf(i);
      const idx = fill[b]++;
      const row = Math.floor(idx / per), col = idx % per;
      const y = base - (row + 0.5) * rowH;
      ctx.fillStyle = P.z[i] < userZ ? emerald : '#6b76c4';
      ctx.globalAlpha = P.z[i] < userZ ? 0.95 : 0.8;
      ctx.beginPath(); ctx.arc(left + b * colW + (col + 0.5) * d, y, d * 0.42, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // you
    const bx = left + ((Math.log10(clamp(userZ, 0.5, 1000)) - lo) / (hi - lo)) * plotW;
    const binU = clamp(Math.floor(((Math.log10(clamp(userZ, 0.5, 1000)) - lo) / (hi - lo)) * B), 0, B - 1);
    const topY = base - Math.ceil(fill[binU] / per) * rowH - 30;
    ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(bx, topY + 6); ctx.lineTo(bx, base + 10); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(bx, topY, 13, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(bx, topY, 28, 0, 7); ctx.fill(); ctx.globalAlpha = 1;

    // the eight bars
    if (opts.areas) {
      const y0 = 968, gap = 36, barX = 400, barW = 470;
      // the longest area name (it is longer in Spanish) must fit left of the bars
      const names = R.dims.map((dim) => t('dim.' + dim.id));
      let fs = 24;
      ctx.font = `600 ${fs}px ${F}`;
      while (fs > 17 && Math.max(...names.map((s) => ctx.measureText(s).width)) > barX - 80 - 14) { fs--; ctx.font = `600 ${fs}px ${F}`; }
      R.dims.forEach((dim, j) => {
        const y = y0 + j * gap;
        ctx.font = `600 ${fs}px ${F}`; ctx.fillStyle = ink2; ctx.textAlign = 'left'; ctx.fillText(names[j], 80, y + 8);
        ctx.fillStyle = 'rgba(160,174,255,0.16)'; rr(ctx, barX, y - 8, barW, 16, 8); ctx.fill();
        ctx.fillStyle = emerald; rr(ctx, barX, y - 8, Math.max(16, barW * dim.global), 16, 8); ctx.fill();
        ctx.font = `600 24px ${F}`; ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText(t('a.top', { pct: HLIA.util.topLabel(1 - dim.global) }), 1000, y + 8);
      });
      ctx.textAlign = 'left';
    }
    // footer
    ctx.fillStyle = ink; ctx.font = `700 46px ${F}`; ctx.fillText(t('s.card.ask'), 80, 1290);
    const host = /^https?:/.test(location.protocol) ? location.host : '';
    if (host) { ctx.textAlign = 'right'; ctx.fillStyle = ink2; ctx.font = `500 30px ${F}`; ctx.fillText(host, 1000, 1290); ctx.textAlign = 'left'; }
  }

  function section(R) {
    const opts = { country: false, areas: true };
    const canvas = el('canvas', { class: 'share-canvas', role: 'img', 'aria-label': t('s.alt', { pct: HLIA.util.topLabel(R.overall.ahead) }) });
    const render = async () => { try { await document.fonts.load('800 100px "Mona Sans"'); await document.fonts.load('650 40px "Mona Sans"'); } catch (e) { /* use fallback */ } draw(canvas, R, opts); };
    const sw = (key, labelKey) => {
      const id = 'sh-' + key;
      const input = el('input', { type: 'checkbox', role: 'switch', id }); input.checked = opts[key];
      input.addEventListener('change', () => { opts[key] = input.checked; render(); });
      return el('label', { class: 'switch', for: id }, input, el('span', { class: 'track', 'aria-hidden': 'true' }), el('span', { class: 'switch-text' }, t(labelKey)));
    };
    const text = t('s.text', { pct: HLIA.util.topLabel(R.overall.ahead), pop: i18n.people(HLIA.DATA.meta.pipPop) });
    const blob = () => new Promise((res) => canvas.toBlob(res, 'image/png'));
    const copy = el('button', { type: 'button', class: 'btn btn-ghost', onclick: async () => { try { await navigator.clipboard.writeText(text + (location.protocol.startsWith('http') ? ' ' + location.origin : '')); copy.textContent = t('s.copied'); setTimeout(() => { copy.textContent = t('s.copy'); }, 1600); } catch (e) { /* clipboard blocked */ } } }, t('s.copy'));
    const dl = el('button', { type: 'button', class: 'btn btn-ghost', onclick: async () => { const b = await blob(); const a = el('a', { href: URL.createObjectURL(b), download: 'how-lucky-i-am.png' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } }, HLIA.ui.icon('download'), ' ', t('s.download'));
    const shareBtn = el('button', { type: 'button', class: 'btn btn-primary', onclick: async () => {
      const b = await blob();
      const file = new File([b], 'how-lucky-i-am.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text });
        else if (navigator.share) await navigator.share({ text, url: location.origin });
        else dl.click();
      } catch (e) { /* the person closed the share sheet */ }
    } }, HLIA.ui.icon('share'), ' ', t('s.share'));
    render();
    const sec = HLIA.results.section('share', 's.title', null, [
      el('div', { class: 'share-grid' },
        el('div', { class: 'share-preview' }, canvas),
        el('div', { class: 'share-side' }, sw('country', 's.country'), sw('areas', 's.areas'), el('div', { class: 'share-actions' }, shareBtn, dl, copy))),
    ], { introKey: 's.body', wide: true });
    return sec;
  }

  HLIA.share = { section, draw };
})(window);
