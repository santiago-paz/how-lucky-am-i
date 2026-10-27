// Draws the small Lottie animations the report uses and writes them to assets/lottie/.
//   clover    a four-leaf clover that pops in, then sways
//   check     a disc with a check mark that draws itself
//   sparkles  four-point stars that twinkle in turn
//   arrow     a chevron that bobs, for "scroll to see why"
// They are plain Lottie JSON (Bodymovin format), made in the colours of the site, and played with
// lottie-web (the light SVG build). Run: node scripts/make-lottie.mjs

import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'assets/lottie';
mkdirSync(OUT, { recursive: true });

// ---------- small helpers ----------
function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const hex = (h) => [1, 3, 5].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 1000) / 1000).concat(1);
const n2 = (v) => Math.round(v * 100) / 100;
const still = (k) => ({ a: 0, k });
const moving = (k) => ({ a: 1, k });

// easing handles (cubic bezier control points)
const EASE = {
  lin: { o: { x: 0, y: 0 }, i: { x: 1, y: 1 } },
  out: { o: { x: 0.16, y: 1 }, i: { x: 0.3, y: 1 } },
  in: { o: { x: 0.7, y: 0 }, i: { x: 0.84, y: 0 } },
  inOut: { o: { x: 0.45, y: 0 }, i: { x: 0.55, y: 1 } },
  back: { o: { x: 0.34, y: 1.56 }, i: { x: 0.64, y: 1 } },
};
// keyframes from [[frame, value, easing], ...]. The last easing is unused.
const kf = (list) => list.map(([t, s, e], i) => {
  const base = { t, s: Array.isArray(s) ? s : [s] };
  return i === list.length - 1 ? base : { ...base, ...(EASE[e || 'lin']) };
});

const transform = ({ p = [0, 0, 0], a = [0, 0, 0], s = [100, 100, 100], r = 0, o = 100 } = {}) => ({
  ty: 'tr', p: p.a === undefined ? still(p) : p, a: still(a), s: s.a === undefined ? still(s) : s, r: r.a === undefined ? still(r) : r, o: o.a === undefined ? still(o) : o, sk: still(0), sa: still(0), nm: 'Transform',
});
const fill = (color) => ({ ty: 'fl', c: still(color), o: still(100), r: 1, bm: 0, nm: 'Fill' });
const stroke = (color, w) => ({ ty: 'st', c: still(color), o: still(100), w: still(w), lc: 2, lj: 2, bm: 0, nm: 'Stroke' });
const group = (items, name = 'Group') => ({ ty: 'gr', it: [...items, transform()], nm: name, np: items.length, cix: 2, bm: 0 });
const ellipse = (d, p = [0, 0]) => ({ ty: 'el', d: 1, s: still([d, d]), p: still(p), nm: 'Ellipse' });
const rect = (w, h, round = 0) => ({ ty: 'rc', d: 1, s: still([w, h]), p: still([0, 0]), r: still(round), nm: 'Rect' });
const poly = (v, closed = true, i, o) => ({ ty: 'sh', ks: still({ i: i || v.map(() => [0, 0]), o: o || v.map(() => [0, 0]), v, c: closed }), nm: 'Path' });
const star = (points, outer, inner) => ({ ty: 'sr', sy: 1, d: 1, pt: still(points), p: still([0, 0]), r: still(0), ir: still(inner), is: still(0), or: still(outer), os: still(0), nm: 'Star' });

let layerNo = 0;
const layer = (name, ks, shapes, { ip = 0, op, st = 0 } = {}) => ({
  ddd: 0, ind: ++layerNo, ty: 4, nm: name, sr: 1,
  ks: { o: still(100), r: still(0), p: still([0, 0, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]), ...ks },
  ao: 0, shapes, ip, op, st, bm: 0,
});
const comp = (name, w, h, op, layers, fr = 60) => ({ v: '5.7.4', fr, ip: 0, op, w, h, nm: name, ddd: 0, assets: [], layers });
const save = (name, json) => { layerNo = 0; writeFileSync(`${OUT}/${name}.json`, JSON.stringify(json)); console.log(name.padEnd(9), (JSON.stringify(json).length / 1024).toFixed(1) + ' KB'); };

const C = {
  emerald: hex('#35d6a0'), emerald2: hex('#2dc291'), mint: hex('#9bffe0'), cyan: hex('#3cc8ff'), violet: hex('#9b8cff'),
  gold: hex('#ffc14d'), white: hex('#eef1ff'), ink: hex('#04121c'), soft: hex('#b4bce3'), stem: hex('#1d8f6b'),
};

// ---------- clover: four hearts around one point, on a bent stem ----------
function clover() {
  const OP = 190;
  const heart = (color) => group([
    poly([[0, 0], [-21.2, -21.2], [0, -42.4], [21.2, -21.2]]), // the diamond
    ellipse(30, [-10.6, -31.8]), ellipse(30, [10.6, -31.8]), // two lobes
    fill(color),
  ], 'Heart');
  const leaves = [0, 90, 180, 270].map((deg, i) => layer(`leaf ${i}`, {
    p: still([100, 96, 0]),
    r: moving(kf([[0, deg], [OP, deg]])),
    s: moving(kf([[0, [0, 0, 100], 'back'], [26, [128, 128, 100], 'inOut'], [100, [138, 138, 100], 'inOut'], [150, [128, 128, 100], 'inOut'], [OP, [128, 128, 100]]])),
  }, [heart(i % 2 ? C.emerald2 : C.emerald)], { op: OP }));
  const stem = layer('stem', { p: still([100, 96, 0]) }, [group([
    poly([[0, 8], [14, 92]], false, [[0, 0], [0, -26]], [[0, 30], [0, 0]]),
    { ...stroke(C.stem, 7), lc: 2 },
    { ty: 'tm', s: still(0), e: moving(kf([[8, 0, 'out'], [40, 100]])), o: still(0), m: 1, nm: 'Trim' },
  ], 'Stem')], { op: OP });
  const glow = layer('centre', { p: still([100, 96, 0]), s: moving(kf([[10, [0, 0, 100], 'back'], [34, [100, 100, 100]]])) }, [group([ellipse(13), fill(C.mint)], 'Centre')], { op: OP });
  const whole = layers_sway([glow, ...leaves, stem], OP); // the first layer is the top one
  return comp('clover', 200, 200, OP, whole);
}
// the whole plant sways a little once it has popped in: a parent null that the others follow
function layers_sway(list, OP) {
  const nullLayer = { ddd: 0, ind: 99, ty: 3, nm: 'sway', sr: 1, ks: { o: still(0), r: moving(kf([[40, 0, 'inOut'], [95, -5, 'inOut'], [150, 5, 'inOut'], [OP, 0]])), p: still([100, 100, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]) }, ao: 0, ip: 0, op: OP, st: 0, bm: 0 };
  // children keep their own positions; they are expressed relative to the parent's centre (100, 100)
  list.forEach((l) => {
    l.parent = 99;
    const p = l.ks.p.k;
    l.ks.p = still([p[0] - 100, p[1] - 100, 0]);
  });
  return [...list, nullLayer];
}

// ---------- check: an emerald disc and a tick that is drawn on it ----------
function check() {
  const OP = 56;
  const disc = layer('disc', { p: still([60, 60, 0]), s: moving(kf([[0, [0, 0, 100], 'back'], [16, [100, 100, 100]]])) }, [group([ellipse(92), fill(C.emerald)], 'Disc')], { op: OP });
  const tick = layer('tick', { p: still([60, 60, 0]) }, [group([
    poly([[-18, 3], [-5, 15], [20, -13]], false),
    { ...stroke(C.ink, 9), lc: 2, lj: 2 },
    { ty: 'tm', s: still(0), e: moving(kf([[12, 0, 'out'], [30, 100]])), o: still(0), m: 1, nm: 'Trim' },
  ], 'Tick')], { op: OP });
  return comp('check', 120, 120, OP, [tick, disc]);
}

// ---------- sparkles: stars that open and close in turn ----------
function sparkles() {
  const OP = 180;
  // The picture is the size of the share card plus a margin (480x560), and the stars sit in that margin,
  // so they frame the card instead of landing on its text.
  const spots = [[30, 96, 22, C.gold, 0], [452, 70, 20, C.white, 30], [236, 16, 14, C.cyan, 70], [458, 300, 24, C.gold, 100], [24, 400, 16, C.mint, 50], [300, 546, 20, C.white, 125], [446, 500, 13, C.violet, 85]];
  const layers = spots.map(([x, y, size, color, delay], i) => layer(`spark ${i}`, {
    p: still([x, y, 0]),
    r: moving(kf([[delay, 0], [delay + 50, 90]])),
    s: moving(kf([[0, [0, 0, 100]], [delay, [0, 0, 100], 'out'], [delay + 22, [100, 100, 100], 'inOut'], [delay + 50, [0, 0, 100]], [OP, [0, 0, 100]]])),
  }, [group([star(4, size, size * 0.2), fill(color)], 'Star')], { op: OP }));
  return comp('sparkles', 480, 560, OP, layers);
}

// ---------- arrow: a chevron that bobs down and back ----------
function arrow() {
  const OP = 100;
  const chevron = layer('chevron', {
    p: moving(kf([[0, [24, 22, 0], 'inOut'], [50, [24, 34, 0], 'inOut'], [OP, [24, 22, 0]]])),
    o: moving(kf([[0, 55, 'inOut'], [50, 100, 'inOut'], [OP, 55]])),
  }, [group([poly([[-10, -5], [0, 5], [10, -5]], false), { ...stroke(C.soft, 4), lc: 2, lj: 2 }], 'Chevron')], { op: OP });
  return comp('arrow', 48, 64, OP, [chevron]);
}

save('clover', clover());
save('check', check());
save('sparkles', sparkles());
save('arrow', arrow());
