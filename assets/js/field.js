/* The field: draws the people dots on a canvas in two arrangements and morphs between them.
     "map"    each dot sits where its person lives, like Earth at night
     "income" the same dots, sorted into a histogram of daily income (log scale), stacked as dots
   One gold dot can stand for you. A sweep line can pass across the income layout and turn
   everyone behind you emerald. All layout math is in CSS pixels. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { clamp, lerp, ease, tween, reducedMotion, cssVar } = HLIA.util;
  const LO = Math.log10(0.5); // left edge of the income axis, dollars a day
  const HI = Math.log10(1000); // right edge
  const PER = 3; // dots per row inside one histogram column
  const DMAX = 0.42; // largest start delay of a dot in a morph (share of the whole move)

  const G_NEUTRAL = 0, G_BEHIND = 1, G_AHEAD = 2, G_RAMP = 3; // ramp uses groups 3..7
  let shapePaths = null;
  function shapes() {
    if (!shapePaths) shapePaths = HLIA.MAP.shapes.map(([key, d]) => ({ key, path: new Path2D(d) }));
    return shapePaths;
  }

  class DotField {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        mode: 'map', glow: true, twinkle: false, interactive: true, silhouette: true,
        mapFit: 'width', mapAnchor: 0.5, margins: { l: 24, r: 24, t: 24, b: 44 },
      }, opts);
      this.mode = this.opts.mode;
      this.P = HLIA.people;
      const n = this.P.n;
      this.px = new Float32Array(n);
      this.py = new Float32Array(n);
      this.delay = new Float32Array(n);
      this.arc = new Float32Array(n);
      this.jit = new Float32Array(n * 2);
      const r = HLIA.util.rng(777);
      for (let i = 0; i < n; i++) { this.jit[2 * i] = r() - 0.5; this.jit[2 * i + 1] = r() - 0.5; this.arc[i] = 0.35 + 0.65 * r(); }
      this.phase = new Uint8Array(n);
      for (let i = 0; i < n; i++) this.phase[i] = i & 3;
      this.group = new Uint8Array(n);
      this.user = null; // { z, id }
      this.colorBy = 'neutral';
      this.sweepX = null;
      this.hover = -1;
      this.focusCountry = -1;
      this.trans = null;
      this.u = 0;
      this.raf = 0;
      this.visible = true;
      this.t0 = performance.now();
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);
      this.listeners = [];
      this.onHover = this.opts.onHover || null;
      this.readColors();
      this.resize();
      this.bind();
      this.render();
    }

    // ---------- setup ----------
    readColors() {
      const v = cssVar;
      this.col = {
        neutral: v('--ramp-v3') || '#a397f6', behind: v('--ahead') || '#35d6a0', ahead: '#5d68a8',
        you: v('--you') || '#ffc14d', land: 'rgba(130, 145, 255, 0.07)', ink: v('--ink') || '#eef1ff',
        ramp: ['#5b4bbf', '#7263d9', '#8a7ceb', '#bcb1fc', '#e9e4ff'],
      };
    }
    bind() {
      const c = this.canvas;
      this.ro = new ResizeObserver(HLIA.util.rafThrottle(() => { this.resize(); this.render(); }));
      this.ro.observe(c.parentElement || c);
      this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; this.kick(); }, { threshold: 0 });
      this.io.observe(c);
      // the "pause motion" button: start the twinkle again when motion comes back
      this.onMotion = () => { this.kick(); this.render(); };
      HLIA.bus.on('motion', this.onMotion);
      if (this.opts.interactive) {
        const move = (e) => this.pointer(e);
        c.addEventListener('pointermove', move);
        c.addEventListener('pointerdown', move);
        c.addEventListener('pointerleave', () => this.setHover(-1));
        this.listeners.push(['pointermove', move], ['pointerdown', move]);
      }
    }
    destroy() {
      cancelAnimationFrame(this.raf);
      this.ro && this.ro.disconnect();
      this.io && this.io.disconnect();
      HLIA.bus.off('motion', this.onMotion);
      this.listeners.forEach(([t, f]) => this.canvas.removeEventListener(t, f));
    }
    resize() {
      const box = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
      const w = Math.max(160, Math.round(box.width));
      const h = Math.max(120, Math.round(this.opts.height ? (typeof this.opts.height === 'function' ? this.opts.height(w) : this.opts.height) : box.height));
      this.w = w; this.h = h;
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.layoutMap();
      this.layoutIncome();
      this.grid = null;
    }

    // ---------- layouts ----------
    layoutMap() {
      const P = this.P, n = P.n, vb = P.vb;
      const s = this.opts.mapFit === 'height' ? this.h / vb[3] : Math.min(this.w / vb[2], this.h / vb[3]);
      const ox = (this.w - vb[2] * s) / 2;
      const oy = (this.h - vb[3] * s) * this.opts.mapAnchor;
      const x = new Float32Array(n), y = new Float32Array(n);
      for (let i = 0; i < n; i++) { x[i] = ox + (P.mapX[i] - vb[0]) * s; y[i] = oy + (P.mapY[i] - vb[1]) * s; }
      this.map = { x, y, s, ox, oy, r: clamp(s * 0.72, 0.8, 2.1) };
    }
    bin(zv, B) { return clamp(Math.floor(((Math.log10(Math.max(zv, 0.01)) - LO) / (HI - LO)) * B), 0, B - 1); }
    layoutIncome() {
      const P = this.P, n = P.n, m = this.opts.margins;
      const plotW = Math.max(120, this.w - m.l - m.r);
      const baseY = this.h - m.b;
      const maxH = Math.max(90, baseY - m.t);
      let pick = null;
      for (let d = 5.6; d >= 1.2; d -= 0.1) {
        const B = Math.max(10, Math.floor(plotW / (d * PER)));
        const counts = new Uint16Array(B);
        for (let i = 0; i < n; i++) counts[this.bin(P.z[i], B)]++;
        let mx = 0;
        for (let b = 0; b < B; b++) if (counts[b] > mx) mx = counts[b];
        if (Math.ceil(mx / PER) * d * 0.88 <= maxH * 0.95 || d < 1.25) { pick = { d, B, counts }; break; }
      }
      const { d, B, counts } = pick;
      const colW = plotW / B, sx = colW / PER, rowH = d * 0.88;
      const x = new Float32Array(n), y = new Float32Array(n);
      const fill = new Uint16Array(B);
      for (let r = 0; r < n; r++) {
        const i = P.order[r];
        const b = this.bin(P.z[i], B);
        const k = fill[b]++;
        const row = Math.floor(k / PER), col = k % PER;
        const odd = row & 1 ? 0.25 : -0.25;
        x[i] = m.l + b * colW + (col + 0.5 + odd) * sx + this.jit[2 * i] * sx * 0.3;
        y[i] = baseY - (row + 0.5) * rowH + this.jit[2 * i + 1] * rowH * 0.3;
      }
      this.inc = {
        x, y, d, B, colW, rowH, counts, baseY, left: m.l, plotW, top: m.t, r: d * 0.47,
        xOfZ: (zv) => m.l + ((Math.log10(clamp(zv, 0.5, 1000)) - LO) / (HI - LO)) * plotW,
        stackTop: (zv) => baseY - Math.ceil(counts[this.bin(zv, B)] / PER) * rowH,
      };
    }
    get layoutInfo() { return this.inc; }
    xOfZ(zv) { return this.inc.xOfZ(zv); }

    // ---------- state ----------
    setUser(user) { this.user = user; this.recolor(); this.render(); }
    setColorBy(mode) { this.colorBy = mode; this.recolor(); this.render(); }
    setSweepX(x) { this.sweepX = x; this.render(); }
    setHover(i) {
      if (i === this.hover) return;
      this.hover = i;
      if (this.onHover) this.onHover(i < 0 ? null : { index: i, x: this.cur().x[i], y: this.cur().y[i], country: this.P.country(i), z: this.P.z[i], pct: this.P.pct(i) });
      this.render();
    }
    highlightCountry(id) {
      this.focusCountry = id == null ? -1 : this.P.idIndex[id] ?? -1;
      this.render();
    }
    cur() { return this.mode === 'income' ? this.inc : this.map; }
    recolor() {
      const P = this.P, g = this.group;
      const uz = this.user ? this.user.z : null;
      for (let i = 0; i < P.n; i++) {
        if (this.colorBy === 'split' && uz != null) g[i] = P.z[i] < uz ? G_BEHIND : G_AHEAD;
        else if (this.colorBy === 'income') g[i] = G_RAMP + Math.min(4, Math.floor(P.pct(i) * 5));
        else g[i] = G_NEUTRAL;
      }
    }

    // ---------- movement ----------
    setMode(mode, { duration = 2300 } = {}) {
      if (mode === this.mode && !this.trans) return Promise.resolve();
      const from = this.trans ? (this.u > 0.5 ? this.trans.to : this.trans.from) : this.mode;
      if (this.trans && this.trans.cancel) this.trans.cancel();
      const toward = mode === 'income';
      const P = this.P, n = P.n;
      // dots start moving in a wave that follows where they are going
      const dest = toward ? this.inc : this.map;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < n; i++) { if (dest.x[i] < lo) lo = dest.x[i]; if (dest.x[i] > hi) hi = dest.x[i]; }
      for (let i = 0; i < n; i++) this.delay[i] = DMAX * (0.85 * ((dest.x[i] - lo) / (hi - lo || 1)) + 0.15 * (this.jit[2 * i] + 0.5));
      this.trans = { from, to: mode };
      this.u = 0;
      const raw = tween(duration, (e) => { this.u = e; this.render(); }, (t) => t);
      const p = raw.then(() => {
        this.mode = mode; this.trans = null; this.u = 0; this.grid = null; this.render();
      });
      this.trans.cancel = raw.cancel;
      this.kick();
      return p;
    }
    // Skip: a move that is running, and the sweep line, end where they were going.
    finish() {
      if (this.trans) {
        const to = this.trans.to;
        if (this.trans.cancel) this.trans.cancel();
        this.mode = to; this.trans = null; this.u = 0; this.grid = null;
      }
      if (this.sweepRaw) this.sweepRaw.cancel();
      this.sweepX = null;
      this.render();
    }
    // Pass the sweep line over the income layout up to your position, calling onProgress(0..1, x).
    sweep(ms = 2600, onProgress) {
      if (!this.user) return Promise.resolve();
      const x0 = this.inc.left - 6;
      const x1 = this.inc.xOfZ(this.user.z);
      this.sweepRaw = tween(ms, (e) => {
        this.sweepX = lerp(x0, x1, e);
        if (onProgress) onProgress(e, this.sweepX);
        this.render();
      }, ease.inOutSine);
      return this.sweepRaw.then(() => { this.sweepX = null; this.render(); });
    }

    // ---------- pointer ----------
    buildGrid() {
      const cell = 16, c = this.cur();
      const cols = Math.ceil(this.w / cell) + 1, rows = Math.ceil(this.h / cell) + 1;
      const cells = new Array(cols * rows);
      for (let i = 0; i < this.P.n; i++) {
        const k = Math.floor(c.y[i] / cell) * cols + Math.floor(c.x[i] / cell);
        if (k < 0 || k >= cells.length) continue;
        (cells[k] ||= []).push(i);
      }
      this.grid = { cell, cols, rows, cells };
    }
    pointer(e) {
      if (this.trans || this.sweepX != null) return;
      if (!this.grid) this.buildGrid();
      const r = this.canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const { cell, cols, rows, cells } = this.grid;
      const cx = Math.floor(px / cell), cy = Math.floor(py / cell), c = this.cur();
      let best = -1, bd = (this.mode === 'map' ? 16 : 14) ** 2;
      for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
        const list = cells[yy * cols + xx];
        if (!list) continue;
        for (const i of list) { const d = (c.x[i] - px) ** 2 + (c.y[i] - py) ** 2; if (d < bd) { bd = d; best = i; } }
      }
      this.setHover(best);
    }

    // ---------- drawing ----------
    kick() {
      if (this.raf) return;
      const loop = () => {
        this.raf = 0;
        const animated = this.trans || (this.opts.twinkle && !reducedMotion() && this.visible);
        if (animated) { this.render(); this.raf = requestAnimationFrame(loop); }
      };
      this.raf = requestAnimationFrame(loop);
    }
    render() {
      const ctx = this.ctx, P = this.P, n = P.n;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      const now = performance.now() - this.t0;
      const tr = this.trans;
      const A = tr ? (tr.from === 'income' ? this.inc : this.map) : this.cur();
      const B = tr ? (tr.to === 'income' ? this.inc : this.map) : A;
      const px = this.px, py = this.py;
      let mixSize = tr ? (tr.to === 'income' ? this.u : 1 - this.u) : (this.mode === 'income' ? 1 : 0);
      if (!tr) {
        for (let i = 0; i < n; i++) { px[i] = A.x[i]; py[i] = A.y[i]; }
      } else {
        const span = 1 - DMAX;
        const lift = Math.min(90, this.h * 0.14);
        for (let i = 0; i < n; i++) {
          const p = clamp((this.u - this.delay[i]) / span, 0, 1);
          const e = ease.inOutCubic(p);
          px[i] = A.x[i] + (B.x[i] - A.x[i]) * e;
          py[i] = A.y[i] + (B.y[i] - A.y[i]) * e - Math.sin(Math.PI * e) * lift * this.arc[i];
        }
      }
      const mapShare = 1 - mixSize; // how much "map" is left
      // land silhouettes
      if (this.opts.silhouette && mapShare > 0.02) {
        ctx.save();
        ctx.globalAlpha = mapShare * mapShare;
        const m = this.map, vb = this.P.vb;
        ctx.translate(m.ox, m.oy);
        ctx.scale(m.s, m.s);
        ctx.translate(-vb[0], -vb[1]);
        ctx.fillStyle = this.col.land;
        for (const s of shapes()) ctx.fill(s.path);
        ctx.restore();
      }
      const rr = lerp(this.map.r, this.inc.r, mixSize);
      const cols = [this.col.neutral, this.col.behind, this.col.ahead, ...this.col.ramp];
      const sweepX = this.sweepX;
      const g = this.group;
      // dots, one pass per color
      const hasFocus = this.focusCountry >= 0;
      for (let gi = 0; gi < cols.length; gi++) {
        ctx.beginPath();
        let any = false;
        for (let i = 0; i < n; i++) {
          let gg = g[i];
          if (gg === G_BEHIND && sweepX != null && px[i] > sweepX) gg = G_AHEAD;
          if (gg !== gi) continue;
          if (hasFocus && P.ci[i] === this.focusCountry) continue;
          const x = px[i], y = py[i];
          ctx.moveTo(x + rr, y);
          ctx.arc(x, y, rr, 0, 6.2832);
          any = true;
        }
        if (!any) continue;
        ctx.fillStyle = cols[gi];
        ctx.globalAlpha = mapShare > 0.5 ? (gi === G_AHEAD ? 0.7 : 0.9) : 1;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // glow on the map: a soft second pass and a slow twinkle
      if (this.opts.glow && mapShare > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glowR = rr * 2.8;
        for (let ph = 0; ph < 4; ph++) {
          const tw = this.opts.twinkle && !reducedMotion() ? 0.5 + 0.5 * Math.sin(now / 650 + ph * 1.7) : 0.6;
          ctx.globalAlpha = 0.07 * mapShare + 0.1 * tw * mapShare;
          ctx.beginPath();
          for (let i = ph; i < n; i += 4) {
            if (g[i] === G_AHEAD && this.colorBy === 'split') continue;
            ctx.moveTo(px[i] + glowR, py[i]);
            ctx.arc(px[i], py[i], glowR, 0, 6.2832);
          }
          ctx.fillStyle = this.colorBy === 'split' ? this.col.behind : this.col.neutral;
          ctx.fill();
        }
        ctx.restore();
      }
      // focused country on top
      if (hasFocus) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          if (P.ci[i] !== this.focusCountry) continue;
          ctx.moveTo(px[i] + rr * 1.5, py[i]);
          ctx.arc(px[i], py[i], rr * 1.5, 0, 6.2832);
        }
        ctx.fillStyle = this.col.you;
        ctx.fill();
      }
      // hover ring
      if (this.hover >= 0 && !tr) {
        const i = this.hover;
        ctx.beginPath();
        ctx.arc(px[i], py[i], rr + 3.5, 0, 6.2832);
        ctx.strokeStyle = this.col.ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // sweep line
      if (sweepX != null) {
        const inc = this.inc;
        ctx.beginPath();
        ctx.moveTo(sweepX, inc.top - 6);
        ctx.lineTo(sweepX, inc.baseY + 8);
        ctx.strokeStyle = this.col.you;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // you
      if (this.user) this.drawUser(ctx, now, tr ? (tr.to === 'income' ? ease.inOutCubic(this.u) : 1 - ease.inOutCubic(this.u)) : this.mode === 'income' ? 1 : 0);
    }
    userSpot(mix) {
      const u = this.user;
      const a = this.P.anchor(u.id);
      const m = this.map;
      const ax = a ? m.ox + (a[0] - this.P.vb[0]) * m.s : this.w / 2;
      const ay = a ? m.oy + (a[1] - this.P.vb[1]) * m.s : this.h / 2;
      const inc = this.inc;
      const bx = inc.xOfZ(u.z);
      const by = inc.stackTop(u.z) - inc.d * 1.8;
      return { x: lerp(ax, bx, mix), y: lerp(ay, by, mix) - Math.sin(Math.PI * mix) * 30, bx, by };
    }
    drawUser(ctx, now, mix) {
      const { x, y } = this.userSpot(mix);
      const income = mix > 0.5;
      const pulse = reducedMotion() ? 0.5 : 0.5 + 0.5 * Math.sin(now / 420);
      ctx.save();
      if (income) {
        ctx.beginPath();
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x, this.inc.baseY + 2);
        ctx.strokeStyle = this.col.you;
        ctx.globalAlpha = 0.45 * mix;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 0.18 + 0.12 * pulse;
      ctx.beginPath(); ctx.arc(x, y, 13 + 4 * pulse, 0, 6.2832); ctx.fillStyle = this.col.you; ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 6.2832); ctx.fillStyle = this.col.you; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#070a1c'; ctx.stroke();
      ctx.restore();
      this.userXY = { x, y };
    }
    // Draw once more on demand and report the on-screen position of the "you" dot.
    youPosition() { return this.userXY || null; }
  }

  HLIA.DotField = DotField;
})(window);
