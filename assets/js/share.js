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

  // The address of the site. The card and the shared text always carry it, wherever the page is opened from
  // (a test address means nothing to the people who see the card). The bare domain is shown because it is the
  // one people can remember; it sends them on to the page. The link preview tags in index.html name the address
  // that serves the page, so they differ by the "www." on purpose. If the domain changes, change SITE, those tags
  // and "homepage" in package.json together.
  const SITE = 'https://howluckyami.app';
  const publicOrigin = () => SITE;
  const publicHost = () => SITE.replace(/^https?:\/\//, '');

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // The card is 1080 by 1350. Everything sits on one grid, so the spacing reads the same from top to bottom:
  // 80 px at the sides, about 55 px between blocks, and the type is big enough to read when the card is
  // shrunk to a phone screen (a card shown 390 px wide is 0.36 of the size drawn here).
  const M = 80, RIGHT = W - M;
  const LAY = {
    wordmark: 108,  // baseline of the name at the top
    number: 384,    // baseline of the big number (the label and the percent sign sit on the same line)
    caption: 464,   // baseline of "of 8.3 billion people alive"
    dotsTop: 568,   // where the tallest column of dots may reach (the gold marker needs room above it)
    rule: 1213,     // the thin line above the footer
    footer: 1273,   // baseline of the footer
    rowPitch: 50, rowThick: 18, barsGap: 62, // the eight bars: distance between rows, bar thickness, gap under the chart
  };

  // text that fits a width: shrink it first, then cut it with an ellipsis
  function fitText(ctx, text, weight, size, minSize, maxW, F) {
    let fs = size;
    ctx.font = `${weight} ${fs}px ${F}`;
    while (fs > minSize && ctx.measureText(text).width > maxW) { fs--; ctx.font = `${weight} ${fs}px ${F}`; }
    let out = text;
    while (out.length > 1 && ctx.measureText(out).width > maxW) out = out.slice(0, -1);
    return { text: out === text ? text : out.trimEnd() + '…', size: fs };
  }

  function draw(canvas, R, opts) {
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const css = HLIA.util.cssVar;
    const gold = css('--you') || '#ffc14d', emerald = css('--ahead') || '#35d6a0', ink = css('--ink') || '#eef1ff', ink2 = css('--ink-2') || '#b4bce3';
    const hair = 'rgba(160,174,255,0.18)';
    const F = '"Mona Sans", system-ui, sans-serif';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070a1c'); g.addColorStop(1, '#0e1330');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // faint stars
    const rnd = HLIA.util.rng(99);
    for (let i = 0; i < 160; i++) { ctx.globalAlpha = 0.1 + rnd() * 0.3; ctx.fillStyle = '#a397f6'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.5, 0.6 + rnd() * 1.2, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

    // the name, and (only if the person chose to show it) the country on the right of the same line
    ctx.font = `700 44px ${F}`; ctx.fillStyle = ink; ctx.fillText('How Lucky Am ', M, LAY.wordmark);
    const w1 = ctx.measureText('How Lucky Am ').width; ctx.fillStyle = gold; ctx.fillText('I', M + w1, LAY.wordmark);
    const w2 = ctx.measureText('I').width; ctx.fillStyle = ink; ctx.fillText('?', M + w1 + w2, LAY.wordmark);
    const nameEnd = M + w1 + w2 + ctx.measureText('?').width;
    if (opts.country) {
      const c = fitText(ctx, i18n.countryName(model.byId[HLIA.state.a.residence]), 600, 36, 22, RIGHT - nameEnd - 56, F);
      ctx.font = `600 ${c.size}px ${F}`; ctx.fillStyle = ink2; ctx.textAlign = 'right'; ctx.fillText(c.text, RIGHT, LAY.wordmark); ctx.textAlign = 'left';
    }

    // the number: "Top", the figure and the percent sign all stand on one baseline
    const top = HLIA.util.topLabel(R.overall.ahead);
    ctx.font = `650 64px ${F}`; const topW = ctx.measureText('Top').width;
    ctx.fillStyle = ink2; ctx.fillText('Top', M, LAY.number);
    const numX = M + topW + 28;
    ctx.font = `800 300px ${F}`; ctx.fillStyle = ink; ctx.fillText(top, numX, LAY.number);
    const numW = ctx.measureText(top).width;
    ctx.font = `700 150px ${F}`; ctx.fillStyle = ink2; ctx.fillText('%', numX + numW + 12, LAY.number);
    ctx.font = `500 46px ${F}`; ctx.fillStyle = ink; ctx.fillText(t('s.card.of', { pop: i18n.people(HLIA.DATA.meta.pipPop) }), M, LAY.caption);

    // the crowd, sorted by income, with you in gold. With the eight bars on, the crowd is a band; without them it fills the card.
    const P = HLIA.people;
    const userZ = R.income.z;
    const base = opts.areas ? 744 : 1150, plotW = W - 2 * M;
    const B = 70, colW = plotW / B;
    const lo = Math.log10(0.5), hi = Math.log10(1000);
    const binOf = (i) => clamp(Math.floor(((Math.log10(Math.max(P.z[i], 0.01)) - lo) / (hi - lo)) * B), 0, B - 1);
    const cnt = new Uint16Array(B);
    for (let r = 0; r < P.n; r++) cnt[binOf(P.order[r])]++;
    const peak = Math.max(...cnt), avail = base - LAY.dotsTop;
    // the smallest dots-per-row that keeps the tallest column inside its band, then the rows are spread to use the band
    let per = 3;
    while (per < 14 && Math.ceil(peak / per) * (colW / per) * 0.9 > avail) per++;
    const d = colW / per, rowsMax = Math.ceil(peak / per);
    const rowH = Math.min(d * 1.35, avail / rowsMax);
    const fill = new Uint16Array(B);
    for (let r = 0; r < P.n; r++) {
      const i = P.order[r];
      const b = binOf(i);
      const idx = fill[b]++;
      const row = Math.floor(idx / per), col = idx % per;
      const y = base - (row + 0.5) * rowH;
      ctx.fillStyle = P.z[i] < userZ ? emerald : '#6b76c4';
      ctx.globalAlpha = P.z[i] < userZ ? 0.95 : 0.8;
      ctx.beginPath(); ctx.arc(M + b * colW + (col + 0.5) * d, y, d * 0.42, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // a thin ground line under the crowd, so it stands on something
    ctx.strokeStyle = hair; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, base + 8); ctx.lineTo(RIGHT, base + 8); ctx.stroke();
    // you
    const bx = M + ((Math.log10(clamp(userZ, 0.5, 1000)) - lo) / (hi - lo)) * plotW;
    const binU = clamp(Math.floor(((Math.log10(clamp(userZ, 0.5, 1000)) - lo) / (hi - lo)) * B), 0, B - 1);
    const topY = base - Math.ceil(fill[binU] / per) * rowH - 34;
    ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(bx, topY + 6); ctx.lineTo(bx, base + 8); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(bx, topY, 13, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(bx, topY, 28, 0, 7); ctx.fill(); ctx.globalAlpha = 1;

    // the eight bars: name on the left, bar in the middle, value on the right
    if (opts.areas) {
      const FS = 30, gap = LAY.rowPitch, y0 = base + LAY.barsGap + LAY.rowThick / 2 + 8, thick = LAY.rowThick;
      const names = R.dims.map((dim) => t('dim.' + dim.id));
      const vals = R.dims.map((dim) => t('a.top', { pct: HLIA.util.topLabel(1 - dim.global) }));
      // the longest area name (it is longer in Spanish) must fit left of the bars; the bars start right after the widest name
      const nameMax = 360;
      let fs = FS;
      ctx.font = `600 ${fs}px ${F}`;
      while (fs > 22 && Math.max(...names.map((s) => ctx.measureText(s).width)) > nameMax) { fs--; ctx.font = `600 ${fs}px ${F}`; }
      const nameW = Math.max(...names.map((s) => ctx.measureText(s).width));
      ctx.font = `650 ${FS}px ${F}`;
      const valW = Math.max(...vals.map((s) => ctx.measureText(s).width));
      const barX = M + nameW + 36, barEnd = RIGHT - valW - 32, barW = barEnd - barX;
      R.dims.forEach((dim, j) => {
        const y = y0 + j * gap;
        ctx.font = `600 ${fs}px ${F}`; ctx.fillStyle = ink2; ctx.textAlign = 'left'; ctx.fillText(names[j], M, y + Math.round(fs * 0.35));
        ctx.fillStyle = 'rgba(160,174,255,0.16)'; rr(ctx, barX, y - thick / 2, barW, thick, thick / 2); ctx.fill();
        ctx.fillStyle = emerald; rr(ctx, barX, y - thick / 2, Math.max(thick, barW * dim.global), thick, thick / 2); ctx.fill();
        ctx.font = `650 ${FS}px ${F}`; ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText(vals[j], RIGHT, y + Math.round(FS * 0.35));
      });
      ctx.textAlign = 'left';
    }

    // footer: a thin line, the question on the left and the address on the right
    ctx.strokeStyle = hair; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, LAY.rule); ctx.lineTo(RIGHT, LAY.rule); ctx.stroke();
    const host = publicHost();
    ctx.font = `650 32px ${F}`;
    const hostW = ctx.measureText(host).width;
    const ask = fitText(ctx, t('s.card.ask'), 700, 46, 30, RIGHT - M - hostW - 40, F);
    ctx.fillStyle = ink; ctx.font = `700 ${ask.size}px ${F}`; ctx.fillText(ask.text, M, LAY.footer);
    ctx.textAlign = 'right'; ctx.fillStyle = ink; ctx.font = `650 32px ${F}`; ctx.fillText(host, RIGHT, LAY.footer); ctx.textAlign = 'left';
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
    const copy = el('button', { type: 'button', class: 'btn btn-ghost', onclick: async () => { try { await navigator.clipboard.writeText(text + ' ' + publicOrigin()); copy.textContent = t('s.copied'); setTimeout(() => { copy.textContent = t('s.copy'); }, 1600); } catch (e) { /* clipboard blocked */ } } }, t('s.copy'));
    const save = async () => { const b = await blob(); const a = el('a', { href: URL.createObjectURL(b), download: 'how-lucky-am-i.png' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    const dl = el('button', { type: 'button', class: 'btn btn-ghost', onclick: save }, HLIA.ui.icon('download'), ' ', t('s.download'));
    const shareBtn = el('button', { type: 'button', class: 'btn btn-primary', onclick: async () => {
      const b = await blob();
      const file = new File([b], 'how-lucky-am-i.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text });
        else if (navigator.share) await navigator.share({ text, url: publicOrigin() });
        else await save();
      } catch (e) { /* the person closed the share sheet */ }
    } }, HLIA.ui.icon('share'), ' ', t('s.share'));
    render();
    const sparkle = el('span', { class: 'fx-sparkles', 'aria-hidden': 'true' });
    if (HLIA.fx) HLIA.fx.sparkles(sparkle);
    const sec = HLIA.results.section('share', 's.title', null, [
      el('div', { class: 'share-grid' },
        el('div', { class: 'share-preview' }, el('div', { class: 'share-sheet' }, canvas, sparkle)),
        el('div', { class: 'share-side' }, sw('country', 's.country'), sw('areas', 's.areas'), el('div', { class: 'share-actions' }, shareBtn, dl, copy))),
    ], { introKey: 's.body', wide: true });
    return sec;
  }

  HLIA.share = { section, draw };
})(window);
