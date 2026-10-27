/* Shared helpers: math, seeded random numbers, number formatting, small DOM and animation helpers.
   No dependencies. Everything hangs off window.HLIA so the site also runs from file://. */
(function (global) {
  'use strict';
  const HLIA = (global.HLIA = global.HLIA || {});

  // ---------- math ----------
  // Error function (Abramowitz and Stegun 7.1.26, max error 1.5e-7).
  function erf(x) {
    const s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));

  // Inverse of the standard normal CDF (Acklam's algorithm, relative error about 1e-9).
  function PhiInv(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const lo = 0.02425;
    let q, r;
    if (p < lo) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > 1 - lo) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sum = (arr) => arr.reduce((s, v) => s + v, 0);

  // Small seeded generator (mulberry32) so layouts are stable between visits.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- easing and animation ----------
  const ease = {
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };

  // True when the system asks for less motion, or when the viewer paused motion with the button in the bar.
  const reducedMotion = () => document.documentElement.dataset.motion === 'off'
    || !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Run fn(progress 0..1) over ms milliseconds. Resolves when done. Jumps to the end when the
  // viewer prefers reduced motion. Returns a promise with a cancel() method.
  function tween(ms, fn, easing = ease.outCubic) {
    let raf = 0;
    let cancelled = false;
    const p = new Promise((resolve) => {
      if (reducedMotion() || ms <= 0) { fn(1); resolve(); return; }
      const t0 = performance.now();
      const step = (now) => {
        if (cancelled) { resolve(); return; }
        const t = clamp((now - t0) / ms, 0, 1);
        fn(easing(t));
        if (t < 1) raf = requestAnimationFrame(step); else resolve();
      };
      raf = requestAnimationFrame(step);
    });
    p.cancel = () => { cancelled = true; cancelAnimationFrame(raf); };
    return p;
  }

  // ---------- formatting ----------
  let locale = 'en';
  const setLocale = (l) => { locale = l; nfCache.clear(); };
  const nfCache = new Map();
  function nf(opts) {
    const key = locale + JSON.stringify(opts);
    if (!nfCache.has(key)) nfCache.set(key, new Intl.NumberFormat(locale, opts));
    return nfCache.get(key);
  }
  const fmt = {
    int: (n) => nf({ maximumFractionDigits: 0 }).format(n),
    dec: (n, d = 1) => nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(n),
    // keeps two significant digits below 10 and rounds to whole numbers above
    smart: (n) => {
      const a = Math.abs(n);
      if (a >= 100) return nf({ maximumFractionDigits: 0 }).format(n);
      if (a >= 10) return nf({ maximumFractionDigits: 1 }).format(n);
      if (a >= 1) return nf({ maximumFractionDigits: 1 }).format(n);
      return nf({ maximumSignificantDigits: 2 }).format(n);
    },
    compact: (n) => nf({ notation: 'compact', maximumFractionDigits: n >= 1e9 ? 1 : n >= 1e6 ? 1 : 0 }).format(n),
    // people counts: "7.4 billion", "840 million" (translated by the caller)
    money: (n, cur = 'USD', digits = 0) => nf({ style: 'currency', currency: cur, maximumFractionDigits: digits, minimumFractionDigits: digits, currencyDisplay: 'narrowSymbol' }).format(n),
  };
  // "Top X%" label for a share of people who are ahead of you (0..1).
  function topLabel(share) {
    const p = share * 100;
    if (p < 0.1) return fmt.dec(0.1, 1);
    if (p < 1) return fmt.dec(p, 2).replace(/0$/, '');
    if (p < 10) return fmt.dec(p, 1);
    return fmt.int(Math.round(p));
  }

  // ---------- DOM ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // el('div', { class: 'x', onclick: fn, 'data-id': 3 }, 'text', childNode)
  function el(tag, attrs, ...kids) {
    const node = tag === 'svg' || (attrs && attrs.ns === 'svg') ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'ns' || v == null || v === false) continue;
        if (k === 'class') node.setAttribute('class', v);
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v; // only ever called with our own static strings
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
    }
    return node;
  }
  const svg = (tag, attrs, ...kids) => el(tag, Object.assign({ ns: 'svg' }, attrs), ...kids);

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }
  function rafThrottle(fn) {
    let queued = false;
    return function (...args) {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; fn.apply(this, args); });
    };
  }

  // Read a CSS custom property from :root as a string.
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  HLIA.util = { erf, Phi, PhiInv, clamp, lerp, sum, rng, ease, reducedMotion, tween, setLocale, fmt, topLabel, $, $$, el, svg, debounce, rafThrottle, cssVar };
})(window);
