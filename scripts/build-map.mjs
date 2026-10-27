// Build assets/js/data/map.js: country shapes (SVG paths in a Natural Earth projection) and a
// "people dot" layout. One dot stands for about one million people. Each country gets as many
// dots as it has millions of people. Part of them sit near that country's cities (weighted by
// city size, in proportion to its urban share) and the rest are spread across the land. The
// placement inside a country is illustrative: the counts per country are the data.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

const KEEP = Number(process.env.MAP_KEEP || 0.25); // share of line points kept after simplifying
const WIDTH = 1000;

// ---- inputs ----
const topo0 = JSON.parse(await readFile('node_modules/world-atlas/countries-50m.json', 'utf8'));
const mledoze = JSON.parse(await readFile('data-raw/misc/countries.json', 'utf8'));
const places = JSON.parse(await readFile('data-raw/misc/places.geojson', 'utf8')).features;
const urbanRows = JSON.parse(await readFile('data-raw/wdi/urban.json', 'utf8')).rows;
const worldSrc = await readFile('assets/js/data/world.js', 'utf8');
const DATA = JSON.parse(worldSrc.slice(worldSrc.indexOf('HLIA.DATA = ') + 12, worldSrc.lastIndexOf(';')));

const urbanShare = {};
for (const r of urbanRows) if (r.value != null && r.countryiso3code && (!urbanShare[r.countryiso3code] || +r.date > urbanShare[r.countryiso3code].y)) urbanShare[r.countryiso3code] = { v: r.value / 100, y: +r.date };

// ---- simplify and project ----
const pre = presimplify(topo0);
const topo = simplify(pre, quantile(pre, KEEP)); // quantile(p) is the weight that keeps about p of the points
const all = feature(topo, topo.objects.countries).features;

const ccn3ToIso3 = Object.fromEntries(mledoze.filter((c) => c.ccn3).map((c) => [c.ccn3, c.cca3]));
const byIso3 = Object.fromEntries(mledoze.map((c) => [c.cca3, c]));
const NAME_FIX = { Kosovo: 'XKX', 'N. Cyprus': 'CYP', Somaliland: 'SOM' };
const known = new Set(DATA.countries.map((c) => c.id));
for (const f of all) {
  let iso = f.id ? ccn3ToIso3[f.id] : null;
  if (!iso) iso = NAME_FIX[f.properties.name] || null;
  f.iso3 = iso;
}
const land = all.filter((f) => f.properties.name !== 'Antarctica');
const projection = geoNaturalEarth1();
projection.fitWidth(WIDTH, { type: 'FeatureCollection', features: land });
const path = geoPath(projection).digits(1);
const [[bx0, by0], [bx1, by1]] = path.bounds({ type: 'FeatureCollection', features: land });
const pad = 3;
const vb = [Math.floor(bx0) - pad, Math.floor(by0) - pad, Math.ceil(bx1 - bx0) + 2 * pad, Math.ceil(by1 - by0) + 2 * pad];

// ---- shapes ----
// Drop islands that would be smaller than MIN_AREA square pixels at the base size.
const MIN_AREA = Number(process.env.MAP_MINAREA || 0.45);
function slim(f) {
  const g = f.geometry;
  if (g.type !== 'MultiPolygon') return f;
  const parts = g.coordinates
    .map((c) => [ringArea(c[0].map((p) => projection(p)).filter(Boolean)), c])
    .sort((a, b) => b[0] - a[0]);
  const keep = parts.filter((p, i) => i === 0 || p[0] >= MIN_AREA).map((p) => p[1]);
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: keep } };
}
const shapes = [];
const terr = {};
let pathBytes = 0;
for (const f of land) {
  const d = path(slim(f));
  if (!d) continue;
  const key = f.iso3 || f.properties.name;
  shapes.push([key, d]);
  pathBytes += d.length;
  if (!f.iso3 || !known.has(f.iso3)) {
    const m = f.iso3 && byIso3[f.iso3];
    terr[key] = { n: m ? m.name.common : f.properties.name, es: m && m.translations.spa ? m.translations.spa.common : m ? m.name.common : f.properties.name };
  }
}
console.log(`shapes ${shapes.length}, path data ${(pathBytes / 1024).toFixed(0)} KB, viewBox ${vb.join(' ')}`);

// Centre of each country's largest piece of land (so France is not pulled toward Guiana).
const cent = {};
for (const f of land) {
  if (!f.iso3) continue;
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const coordinates of polys) {
    const poly = { type: 'Polygon', coordinates };
    const area = path.area(poly);
    if (!cent[f.iso3] || area > cent[f.iso3][2]) {
      const c = path.centroid(poly);
      if (c && Number.isFinite(c[0])) cent[f.iso3] = [+c[0].toFixed(1), +c[1].toFixed(1), area];
    }
  }
}
for (const k of Object.keys(cent)) cent[k] = cent[k].slice(0, 2);

// ---- dots ----
// small seeded random generator so the layout is stable between builds
let seed = 20261027;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

function projectedPolys(f) {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.map((rings) => rings.map((ring) => ring.map((p) => projection(p)).filter(Boolean)));
}
function inside(polys, x, y) {
  // even-odd test over every ring of every polygon (holes count too)
  let hit = false;
  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
    }
  }
  return hit;
}
function bboxOf(polys) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const rings of polys) for (const [x, y] of rings[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
// area of the biggest polygons decides where uniform dots may go
function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); }

// cities by country (Natural Earth uses a few codes that differ from ISO)
const NE_FIX = { SDS: 'SSD', KOS: 'XKX', PSX: 'PSE', SOL: 'SOM', CYN: 'CYP', ROM: 'ROU', ZAR: 'COD', TMP: 'TLS', SAH: 'ESH' };
const cities = {};
for (const p of places) {
  const pr = p.properties;
  const iso = NE_FIX[pr.adm0_a3] || pr.adm0_a3;
  const pop = pr.pop_max || pr.pop_min || 0;
  if (!pop) continue;
  (cities[iso] ||= []).push({ pop, ll: p.geometry.coordinates });
}

const featureByIso = {};
for (const f of land) if (f.iso3 && !featureByIso[f.iso3]) featureByIso[f.iso3] = f;
// Some countries are split into several features (for example N. Cyprus): merge them.
const extraByIso = {};
for (const f of land) if (f.iso3 && featureByIso[f.iso3] !== f) (extraByIso[f.iso3] ||= []).push(f);

const ids = [];
const counts = [];
const X = [], Y = [], C = [];
let missing = [];
const order = [...DATA.countries].sort((a, b) => b.pop - a.pop);
for (const c of order) {
  const n = Math.round(c.pop / 1e6);
  if (n < 1) continue;
  const f = featureByIso[c.id];
  let polys = f ? projectedPolys(f) : [];
  for (const e of extraByIso[c.id] || []) polys = polys.concat(projectedPolys(e));
  const idx = ids.length;
  ids.push(c.id);
  const mine = [];
  if (!polys.length) {
    // no polygon at this resolution: drop the dots on the capital
    const m = byIso3[c.id];
    const p = m && m.latlng ? projection([m.latlng[1], m.latlng[0]]) : null;
    missing.push(c.id);
    for (let k = 0; k < n; k++) mine.push([(p ? p[0] : 0) + gauss() * 1.2, (p ? p[1] : 0) + gauss() * 1.2]);
  } else {
    const [x0, y0, x1, y1] = bboxOf(polys);
    const share = (urbanShare[c.id] ? urbanShare[c.id].v : 0.55);
    const list = (cities[c.id] || []).slice().sort((a, b) => b.pop - a.pop).slice(0, 120);
    const totalCity = list.reduce((s, q) => s + q.pop, 0);
    const nCity = list.length ? Math.round(n * Math.min(0.9, share)) : 0;
    // city dots, shared out in proportion to city size
    if (nCity > 0) {
      let left = nCity;
      const quota = list.map((q) => Math.round((nCity * q.pop) / totalCity));
      // make sure the quotas add up to nCity
      let diff = nCity - quota.reduce((s, v) => s + v, 0);
      for (let i = 0; diff !== 0; i = (i + 1) % quota.length) { if (diff > 0) { quota[i]++; diff--; } else if (quota[i] > 0) { quota[i]--; diff++; } }
      list.forEach((q, i) => {
        const base = projection(q.ll);
        if (!base) return;
        const sigma = Math.min(5, 0.9 + 0.55 * Math.sqrt(quota[i]));
        for (let k = 0; k < quota[i] && left > 0; k++) {
          for (let t = 0; t < 30; t++) {
            const x = base[0] + gauss() * sigma;
            const y = base[1] + gauss() * sigma;
            if (inside(polys, x, y)) { mine.push([x, y]); left--; break; }
            if (t === 29) { mine.push([base[0] + gauss() * 0.4, base[1] + gauss() * 0.4]); left--; }
          }
        }
      });
    }
    // the rest are spread over the land, each new dot placed as far as it can be from the others
    while (mine.length < n) {
      let best = null; let bestD = -1;
      for (let t = 0; t < 8; t++) {
        let x, y, tries = 0;
        do { x = x0 + rand() * (x1 - x0); y = y0 + rand() * (y1 - y0); tries++; } while (!inside(polys, x, y) && tries < 400);
        if (tries >= 400) continue;
        let d = Infinity;
        for (const q of mine) { const dd = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (dd < d) d = dd; }
        if (d > bestD) { bestD = d; best = [x, y]; }
      }
      if (!best) { const base = projection(byIso3[c.id]?.latlng ? [byIso3[c.id].latlng[1], byIso3[c.id].latlng[0]] : [0, 0]); best = [base[0], base[1]]; }
      mine.push(best);
    }
  }
  counts.push(mine.length);
  for (const [x, y] of mine) { X.push(Math.round((x - vb[0]) * 20)); Y.push(Math.round((y - vb[1]) * 20)); C.push(idx); }
}
console.log(`dots ${X.length} in ${ids.length} countries; no polygon for: ${missing.join(' ') || 'none'}`);

const u16 = new Uint16Array(X.length * 2);
X.forEach((x, i) => { u16[2 * i] = Math.max(0, Math.min(65535, x)); u16[2 * i + 1] = Math.max(0, Math.min(65535, Y[i])); });
const xy = Buffer.from(u16.buffer).toString('base64');

// ---- globe data: longitude and latitude of every dot and country centre ----
const ll = new Int16Array(X.length * 2);
for (let i = 0; i < X.length; i++) {
  const p = projection.invert([vb[0] + X[i] / 20, vb[1] + Y[i] / 20]) || [0, 0];
  ll[2 * i] = Math.round(p[0] * 100);
  ll[2 * i + 1] = Math.round(p[1] * 100);
}
const lonlat = Buffer.from(ll.buffer).toString('base64');
const centLL = {};
for (const [k, [x, y]] of Object.entries(cent)) {
  const p = projection.invert([x, y]);
  if (p) centLL[k] = [+p[0].toFixed(2), +p[1].toFixed(2)];
}

// ---- globe texture shapes: a plain longitude/latitude map (equirectangular), coarser data ----
import { geoEquirectangular } from 'd3-geo';
const topo110 = JSON.parse(await readFile('node_modules/world-atlas/countries-110m.json', 'utf8'));
const feats110 = feature(topo110, topo110.objects.countries).features.filter((f) => f.properties.name !== 'Antarctica');
const GW = 2048, GH = 1024;
const eq = geoEquirectangular().fitSize([GW, GH], { type: 'Sphere' });
const eqPath = geoPath(eq).digits(0);
const globeShapes = [];
for (const f of feats110) {
  let iso = f.id ? ccn3ToIso3[f.id] : null;
  if (!iso) iso = NAME_FIX[f.properties.name] || null;
  const d = eqPath(f);
  if (d) globeShapes.push([iso || f.properties.name, d]);
}
console.log(`globe shapes ${globeShapes.length}, ${(globeShapes.reduce((s, x) => s + x[1].length, 0) / 1024).toFixed(0)} KB`);

const map = { vb, scale: 20, ids, counts, xy, shapes, terr, cent };
// the globe needs its own data, loaded only when the results open
const globeData = { lonlat, centLL, w: GW, h: GH, shapes: globeShapes };
await mkdir('assets/js/data', { recursive: true });
await writeFile('assets/js/data/globe.js', `/* Generated by scripts/build-map.mjs. Shapes: Natural Earth via world-atlas (public domain). Do not edit by hand. */\nwindow.HLIA = window.HLIA || {};\nHLIA.GLOBE_DATA = ${JSON.stringify(globeData)};\n`);
const out = `/* Generated by scripts/build-map.mjs. Shapes: Natural Earth via world-atlas (public domain). Do not edit by hand. */\nwindow.HLIA = window.HLIA || {};\nHLIA.MAP = ${JSON.stringify(map)};\n`;
await writeFile('assets/js/data/map.js', out);
console.log(`map.js ${(out.length / 1024).toFixed(0)} KB`);
