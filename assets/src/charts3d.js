/* Two 3D charts for the report, made with three.js and bundled with the globe (npm run build:3d):

     Pyramid3D  the pyramid of luck. Seven solid steps, each as wide as its share of humanity, with a crowd of dots on
                it (one dot is a fixed number of people). Names on the left, head counts on the right, thin lines
                between. Your step is gold.
     Towers3D   the eight areas of life as eight towers in a row. Height is the share of people you are ahead of, read
                against a scale on the wall behind. A violet ring marks the typical person in your country, and a gold
                plane across the row marks your place overall.

   They read window.HLIA only for small helpers (rng, reducedMotion, el, svg). Everything else comes in as
   options. A chart draws nothing while it is off screen, and dispose() gives every resource back. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BoxGeometry, EdgesGeometry, PlaneGeometry, CylinderGeometry, RingGeometry,
  TorusGeometry, BufferGeometry, Float32BufferAttribute, BufferAttribute, Mesh, Points, Sprite, SpriteMaterial, MeshBasicMaterial,
  PointsMaterial, CanvasTexture, Color, Vector2, Vector3, Raycaster, AdditiveBlending, DoubleSide, MathUtils, SRGBColorSpace,
} from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

const HLIA = window.HLIA;
const D2R = Math.PI / 180;
const clamp = MathUtils.clamp;
const WHITE = new Color(0xffffff);
const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
const lighten = (hex, k) => new Color(hex).lerp(WHITE, k);

// ---------- small texture helpers ----------
function canvasTexture(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
// a soft round glow, white in the middle and clear at the edge
const glowTexture = () => canvasTexture((g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
}, 128, 128);
// stops run from the top of the canvas (the top of a box face) to the bottom
const verticalTexture = (stops) => canvasTexture((g, w, h) => {
  const r = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, c]) => r.addColorStop(o, c));
  g.fillStyle = r; g.fillRect(0, 0, w, h);
}, 4, 128);

// a box outline drawn with fat lines, so the edges stay crisp on a sharp screen
function fatEdges(geometry, color, width, opacity, mats) {
  const g = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(geometry));
  // LineMaterial wants a Color object, not a hex number
  const m = new LineMaterial({ color: new Color(color), linewidth: width, transparent: true, opacity, depthWrite: false });
  mats.push(m);
  return new LineSegments2(g, m);
}

// ---------- the base: renderer, camera that orbits, hover, visibility, clean-up ----------
class Stage3D {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = Object.assign({ fov: 30, reduced: false, onHover: null }, opts);
    const r = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!r.getContext()) throw new Error('webgl');
    r.setClearColor(0x000000, 0);
    this.renderer = r;
    this.canvas = r.domElement;
    this.canvas.className = 'c3-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(this.canvas);
    this.labelHost = document.createElement('div');
    this.labelHost.className = 'c3-labels';
    this.labelHost.setAttribute('aria-hidden', 'true');
    container.appendChild(this.labelHost);
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(this.opts.fov, 1, 0.1, 100);
    this.world = new Group();
    this.scene.add(this.world);
    this.dist = 12; this.pitch = 0.36; this.yaw = 0; this.yawOff = 0; this.pitchOff = 0;
    this.target = new Vector3(0, 2, 0);
    this.dragging = false; this.lastTouch = -1e9; this.pointer = null; this.hover = -1; this.forced = -1;
    this.clickables = []; this.lineMats = [];
    this.visible = true; this.time = 0; this.animT = 0; this.last = performance.now();
    this.ray = new Raycaster(); this.ndc = new Vector2();
    this.w = 300; this.h = 300; this.built = false;
    this.bind();
    this.resize();
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }

  reducedNow() { return this.opts.reduced || HLIA.util.reducedMotion(); }

  bind() {
    const c = this.canvas;
    c.style.touchAction = 'pan-y';
    this.onDown = (e) => { this.dragging = true; this.drag = { x: e.clientX, y: e.clientY, yaw: this.yawOff, pitch: this.pitchOff }; try { c.setPointerCapture(e.pointerId); } catch (err) { /* not needed */ } c.classList.add('grabbing'); };
    this.onMove = (e) => {
      const r = c.getBoundingClientRect();
      this.pointer = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1), cx: e.clientX, cy: e.clientY };
      if (this.dragging) {
        this.yawOff = this.drag.yaw - (e.clientX - this.drag.x) * 0.008;
        this.pitchOff = clamp(this.drag.pitch + (e.clientY - this.drag.y) * 0.004, -0.22, 0.45);
        this.lastTouch = performance.now();
      }
    };
    this.onUp = () => { this.dragging = false; this.lastTouch = performance.now(); c.classList.remove('grabbing'); };
    this.onLeave = () => { this.pointer = null; };
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onLeave);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { threshold: 0 });
    this.io.observe(this.container);
  }

  resize() {
    const r = this.container.getBoundingClientRect();
    const w = Math.max(160, Math.round(r.width)), h = Math.max(160, Math.round(r.height));
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const m of this.lineMats) m.resolution.set(w, h);
    if (this.built) this.onResize();
  }
  onResize() {}

  // aim the camera: it orbits the target at the given yaw and pitch
  placeCamera() {
    const cp = Math.cos(this.pitch);
    this.camera.position.set(
      this.target.x + this.dist * cp * Math.sin(this.yaw),
      this.target.y + this.dist * Math.sin(this.pitch),
      this.target.z + this.dist * cp * Math.cos(this.yaw));
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }
  // where a point of the scene lands on the canvas, in CSS pixels
  toScreen(x, y, z) {
    const v = new Vector3(x, y, z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h };
  }
  // the camera distance at which a box of this size (in scene units) fits the frame
  fitDistance(extentX, extentY, margin = 1.1) {
    const tanV = Math.tan((this.opts.fov / 2) * D2R);
    return Math.max(extentY / 2 / tanV, extentX / 2 / (tanV * this.camera.aspect)) * margin;
  }

  play() { this.animT = this.reducedNow() ? 99 : 0; }
  // hover a part from outside (the legend beside the chart)
  highlight(i) { this.forced = i; }
  onHoverChange() {}

  pick() {
    if (this.pointer && !this.dragging && this.clickables.length) {
      this.ray.setFromCamera(this.ndc.set(this.pointer.x, this.pointer.y), this.camera);
      const hit = this.ray.intersectObjects(this.clickables, false)[0];
      const i = hit ? hit.object.userData.index : -1;
      if (i !== this.hover) { this.hover = i; this.onHoverChange(i); }
      if (this.opts.onHover) this.opts.onHover(i < 0 ? null : { index: i, clientX: this.pointer.cx, clientY: this.pointer.cy });
    } else if (!this.pointer && this.hover !== -1) {
      this.hover = -1; this.onHoverChange(-1);
      if (this.opts.onHover) this.opts.onHover(null);
    }
    this.canvas.style.cursor = this.hover >= 0 ? 'pointer' : '';
  }

  update() {}

  // after a quiet moment the view eases back to the one the labels were placed for
  settle(dt) {
    if (this.dragging || performance.now() - this.lastTouch < 2200) return;
    const k = Math.exp(-dt * 1.6);
    this.yawOff *= k; this.pitchOff *= k;
  }

  tick(now) {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.visible || document.hidden || !this.built) { this.last = now; return; }
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now; this.time += dt; this.animT += dt;
    this.pick();
    this.update(dt, this.time);
    this.placeCamera();
    this.renderer.render(this.scene, this.camera);
    this.afterRender();
  }
  afterRender() {}

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro && this.ro.disconnect();
    this.io && this.io.disconnect();
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown); c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp); c.removeEventListener('pointercancel', this.onUp); c.removeEventListener('pointerleave', this.onLeave);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); if (x.alphaMap) x.alphaMap.dispose(); x.dispose(); });
    });
    this.renderer.dispose();
    if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
    c.remove();
    this.labelHost.remove();
  }
}

// a floor that glows, with rings on it, a ring of light that spreads out, and drifting dust
function buildFloor(stage, { radius, color, rings, dust, dustHeight }) {
  const rnd = HLIA.util.rng(777);
  const glow = new Mesh(new PlaneGeometry(radius * 2.6, radius * 2.6), new MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.002;
  stage.world.add(glow);
  for (const r of rings) {
    const ring = new Mesh(new RingGeometry(r - 0.012, r + 0.012, 160), new MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001;
    stage.world.add(ring);
  }
  const pulse = new Mesh(new RingGeometry(0.992, 1, 160), new MeshBasicMaterial({ color: lighten(color, 0.35), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
  pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.002;
  stage.world.add(pulse);
  const pos = new Float32Array(dust * 3);
  for (let i = 0; i < dust; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * radius * 1.15;
    pos[3 * i] = Math.cos(a) * r; pos[3 * i + 1] = rnd() * dustHeight; pos[3 * i + 2] = Math.sin(a) * r;
  }
  const dg = new BufferGeometry(); dg.setAttribute('position', new BufferAttribute(pos, 3));
  const motes = new Points(dg, new PointsMaterial({ color: lighten(color, 0.4), size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }));
  stage.world.add(motes);
  return {
    pulse, motes,
    update(t, reduced) {
      const k = reduced ? 1 : (t % 3.6) / 3.6;
      pulse.scale.setScalar(radius * 0.5 + k * radius * 1.7);
      pulse.material.opacity = reduced ? 0 : 0.5 * (1 - k) * Math.min(1, k * 6);
      if (!reduced) { motes.rotation.y = t * 0.025; motes.position.y = Math.sin(t * 0.4) * 0.12; }
    },
  };
}

// ================= the pyramid of luck =================
// The pyramid has seven steps, bottom half first. A step is a solid slab as wide as its share of humanity (the area of
// its top is the share). People stand on it: one dot is a fixed number of people, so the bottom step is a crowd and the
// top step has a handful. Every step has its name on the left and its head count on the right, joined by a thin line.
const PY = { H: 0.5, GAP: 0.1, A: 0.6, B: 4.2, YAW: 0.62, PITCH: 0.5 };
// how much of its colour each face keeps: the two faces that turn to the viewer, the one that turns away, the underside
const FACE = [0.6, 0.4, null, 0.32, 0.82, 0.5]; // +x, -x, top (lit), bottom, +z, -z

export class Pyramid3D extends Stage3D {
  // o: { tiers: [{ k, share, color, name, count }] from the bottom up, you: k, dots: how many dots stand for all of humanity,
  //      colors: { you }, labels: { you, dot }, reduced, onHover({ index, clientX, clientY } | null) }
  constructor(container, o) {
    super(container, { fov: 30, reduced: o.reduced, onHover: o.onHover });
    this.o = o;
    this.build();
    this.built = true;
    this.onResize();
    this.play();
  }

  build() {
    const { tiers, you } = this.o;
    const { el, svg } = HLIA.util;
    const rnd = HLIA.util.rng(4242);
    const H = this.w < 700 ? 0.84 : PY.H; // a narrow frame stacks two lines of label beside each step, so the steps are thicker
    const gold = new Color(this.o.colors.you);
    this.tiers = [];
    const sides = tiers.map((T) => PY.A + PY.B * Math.sqrt(T.share));
    this.leaders = svg('svg', { class: 'c3-leaders', 'aria-hidden': 'true' });
    this.labelHost.appendChild(this.leaders);
    let y = 0;
    tiers.forEach((T, i) => {
      const isYou = T.k === you;
      const base = new Color(isYou ? gold : T.color);
      const side = sides[i];
      const box = new BoxGeometry(side, H, side);
      const faceBase = FACE.map((k) => (k ? base.clone().multiplyScalar(k) : lighten(base, 0.28)));
      const faces = faceBase.map((c) => new MeshBasicMaterial({ color: c.clone(), transparent: true, opacity: 0 }));
      const body = new Mesh(box, faces);
      body.userData.index = i;
      this.clickables.push(body);
      const edges = fatEdges(box, lighten(base, 0.55), isYou ? 2.4 : 1.4, 0.85, this.lineMats);
      // the people: a crowd on top of the step, around the step above it (which covers the middle)
      const up = i < tiers.length - 1 ? sides[i + 1] : 0;
      const n = Math.max(1, Math.round(T.share * this.o.dots));
      const pos = [];
      for (let tries = 0; pos.length < n * 3 && tries < n * 40; tries++) {
        const px = (rnd() - 0.5) * (side - 0.12), pz = (rnd() - 0.5) * (side - 0.12);
        if (up && Math.abs(px) < up / 2 + 0.05 && Math.abs(pz) < up / 2 + 0.05) continue;
        pos.push(px, H / 2 + 0.014, pz);
      }
      const pg = new BufferGeometry(); pg.setAttribute('position', new Float32BufferAttribute(pos, 3));
      const dotMat = new PointsMaterial({ color: isYou ? lighten(gold, 0.6) : lighten(base, 0.72), size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
      const g = new Group();
      g.add(body, edges, new Points(pg, dotMat));
      g.position.y = y + H / 2;
      this.world.add(g);

      // the labels: the name on the left, the head count on the right, and a thin line from each to the step
      const nameEl = el('div', { class: 'c3-tier' + (isYou ? ' you' : '') }, T.name);
      const countEl = el('div', { class: 'c3-count' + (isYou ? ' you' : '') }, el('span', null, T.count), isYou ? el('b', { class: 'c3-here' }, this.o.labels.you) : null);
      this.labelHost.append(nameEl, countEl);
      const side2 = (dir) => {
        const path = svg('path', { class: 'c3-lead' + (isYou ? ' you' : '') });
        const dot = svg('circle', { r: 2.6, class: 'c3-lead-dot' + (isYou ? ' you' : '') });
        this.leaders.append(path, dot);
        return { path, dot, dir };
      };
      const lead = [side2(-1), side2(1)];
      const idx = i;
      nameEl.addEventListener('pointerenter', () => { this.forced = idx; });
      nameEl.addEventListener('pointerleave', () => { if (this.forced === idx) this.forced = -1; });
      countEl.addEventListener('pointerenter', () => { this.forced = idx; });
      countEl.addEventListener('pointerleave', () => { if (this.forced === idx) this.forced = -1; });
      this.tiers.push({ g, y0: y + H / 2, side, faces, faceBase, edgeMat: edges.material, dotMat, isYou, hover: 0, k: T.k, nameEl, countEl, lead });
      y += H + PY.GAP;
    });
    this.height = y - PY.GAP;
    this.baseSide = Math.max(...this.tiers.map((x) => x.side));
    const youTier = this.tiers.find((x) => x.isYou);

    // a ripple of light spreads from the outline of your step, over and over
    if (youTier) {
      this.ripple = fatEdges(new BoxGeometry(youTier.side, H, youTier.side), lighten(gold, 0.25), 2.2, 0, this.lineMats);
      youTier.g.add(this.ripple);
    }
    this.floor = buildFloor(this, { radius: 4.4, color: new Color(0x7a69ff), rings: [3.0, 4.4], dust: 70, dustHeight: 5.2 });
    this.labelHost.appendChild(el('div', { class: 'c3-note' }, this.o.labels.dot));
  }

  // a point on the right-hand face of step i, in pixels from the top left of the chart: a place that no other step covers
  probe(i) {
    const T = this.tiers[i];
    return this.toScreen(T.side / 2, T.g.position.y, 0);
  }

  // the widest label on each side, in pixels
  measure() {
    this.lw = Math.max(...this.tiers.map((T) => T.nameEl.offsetWidth));
    this.rw = Math.max(...this.tiers.map((T) => T.countEl.firstChild.offsetWidth));
    const here = this.tiers.find((T) => T.isYou);
    this.pillW = here && here.countEl.lastChild && here.countEl.lastChild.className === 'c3-here' ? here.countEl.lastChild.offsetWidth + 10 : 0;
  }

  onResize() {
    this.measure();
    const need = Math.max(this.lw, this.rw + this.pillW) + 44; // room for the labels on one side of the pyramid
    this.narrow = this.w < 700 || this.w - 2 * need < 300;
    this.container.classList.toggle('c3-narrow', this.narrow);
    // on a narrow frame the labels stack in one column on the right, and the pyramid moves to the left of them
    const col = this.narrow ? Math.max(this.lw, this.rw) + 26 : 0;
    const availW = this.narrow ? this.w - col : this.w - 2 * need;
    // the pill on the right makes that side heavier: the whole picture shifts left by half of it
    this.camera.setViewOffset(this.w, this.h, this.narrow ? col / 2 : this.pillW / 2, 0, this.w, this.h);
    this.camera.updateProjectionMatrix();
    this.col = col;
    this.target.set(0, this.height * 0.5 - 0.1, 0);
    const tanV = Math.tan((this.opts.fov / 2) * D2R);
    const extentX = this.baseSide * 1.42 + 0.4, extentY = this.height + 2.5;
    this.dist = Math.max(extentY / 2 / tanV, extentX / 2 / (tanV * (availW / this.h))) * 1.04;
    this.halfS = null;
  }

  onHoverChange() {}

  update(dt, t) {
    const reduced = this.reducedNow();
    const A = this.animT;
    // the steps drop into place one after the other, the poorest first
    const any = this.hover >= 0 || this.forced >= 0;
    this.tiers.forEach((T, i) => {
      const p = reduced ? 1 : clamp((A - 0.1 - i * 0.15) / 0.9, 0, 1);
      T.g.position.y = T.y0 + (1 - ease.outBack(p)) * 3.4;
      const on = (this.hover === i || this.forced === i) ? 1 : 0;
      T.hover += (on - T.hover) * Math.min(1, dt * 10);
      const dim = any ? 1 - 0.55 * (1 - T.hover) : 1;
      const a = ease.outCubic(p) * dim;
      const shine = 0.2 * T.hover + (T.isYou && !reduced ? 0.07 + 0.05 * Math.sin(t * 2.6) : 0);
      T.faces.forEach((m, j) => { m.opacity = a; m.color.copy(T.faceBase[j]).lerp(WHITE, shine); });
      T.edgeMat.opacity = (0.75 + 0.25 * T.hover) * a;
      T.dotMat.opacity = a;
    });
    // the ripple starts once your step has landed
    if (this.ripple) {
      const live = reduced ? 0 : clamp((A - 1.6) / 0.4, 0, 1);
      const k = (t % 2.4) / 2.4;
      this.ripple.scale.set(1 + k * 0.5, 1, 1 + k * 0.5);
      this.ripple.material.opacity = 0.9 * (1 - k) * live;
    }
    this.floor.update(t, reduced);
    // a gentle sway keeps it alive without turning the steps away from their labels
    this.settle(dt);
    this.yaw = PY.YAW + (reduced ? 0 : 0.12 * Math.sin(t * 0.42)) + this.yawOff;
    this.pitch = PY.PITCH + this.pitchOff;
  }

  afterRender() {
    const reduced = this.reducedNow(), A = this.animT, W = this.w;
    const any = this.hover >= 0 || this.forced >= 0;
    // where each step is on the screen right now: its left and right corners, and its middle height
    const rows = this.tiers.map((T) => {
      const y = T.g.position.y, hs = T.side / 2;
      let lo = 1e9, hi = -1e9;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = this.toScreen(sx * hs, y, sz * hs); lo = Math.min(lo, c.x); hi = Math.max(hi, c.x); }
      return { lo, hi, cy: this.toScreen(0, y, 0).y };
    });
    const cx = this.toScreen(0, this.height / 2, 0).x;
    const half = Math.max(...rows.map((r) => (r.hi - r.lo) / 2));
    this.halfS = this.halfS == null ? half : this.halfS + (half - this.halfS) * 0.12; // the columns do not jitter as it sways
    const xL = cx - this.halfS - 30, xR = this.narrow ? W - this.col + 14 : cx + this.halfS + 30;
    const put = (L, x, y, a) => { L.path.setAttribute('d', `M${x[0].toFixed(1)} ${y.toFixed(1)}H${x[1].toFixed(1)}`); L.dot.setAttribute('cx', x[0].toFixed(1)); L.dot.setAttribute('cy', y.toFixed(1)); L.path.style.opacity = L.dot.style.opacity = String(a); };
    this.tiers.forEach((T, i) => {
      const r = rows[i];
      const show = reduced ? 1 : clamp((A - 0.1 - i * 0.15 - 0.6) / 0.35, 0, 1);
      const o = show * (any ? 0.4 + 0.6 * T.hover : 1);
      T.nameEl.style.opacity = T.countEl.style.opacity = String(o);
      if (this.narrow) {
        // one column on the right: the name over the head count
        T.nameEl.style.transform = `translate(${xR}px, ${r.cy}px) translate(0, -100%)`;
        T.countEl.style.transform = `translate(${xR}px, ${r.cy}px) translate(0, 0)`;
        T.nameEl.classList.add('left'); T.lead[0].path.style.opacity = T.lead[0].dot.style.opacity = '0';
        put(T.lead[1], [r.hi + 4, xR - 8], r.cy, o);
      } else {
        T.nameEl.classList.remove('left');
        T.nameEl.style.transform = `translate(${xL}px, ${r.cy}px) translate(-100%, -50%)`;
        T.countEl.style.transform = `translate(${xR}px, ${r.cy}px) translate(0, -50%)`;
        put(T.lead[0], [r.lo - 4, xL + 10], r.cy, o);
        put(T.lead[1], [r.hi + 4, xR - 10], r.cy, o);
      }
    });
  }
}

// ================= the eight towers =================
// Eight towers in a row, as tall as the share of people you are ahead of. Behind them a wall with a scale: half, and
// everyone. A violet ring on each tower marks the typical person in your country. A gold line across the wall marks
// your place overall, so you can see which areas lift you and which hold you back.
const TW = { HMAX: 3.4, W: 0.7, SP: 1.3, YAW: 0, PITCH: 0.33, WALLZ: -1.15, PAD_L: 3.1, PAD_R: 2.7 };

export class Towers3D extends Stage3D {
  // o: { areas: [{ id, value 0..1, typical 0..1, text, name, icon (an svg node) }], overall: { value, text, name },
  //      colors: { you, area, typical }, labels: { ahead, all, half }, reduced, onHover({ index, clientX, clientY } | null) }
  constructor(container, o) {
    super(container, { fov: 30, reduced: o.reduced, onHover: o.onHover });
    this.o = o;
    this.build();
    this.built = true;
    this.onResize();
    this.play();
  }

  build() {
    const { areas, overall, colors } = this.o;
    const el = HLIA.util.el;
    const N = areas.length;
    const areaColor = new Color(colors.area), gold = new Color(colors.you), violet = new Color(colors.typical);
    const bodyMap = verticalTexture([[0, 'rgba(255,255,255,0.32)'], [1, 'rgba(255,255,255,0.95)']]);
    this.rowW = (N - 1) * TW.SP;
    this.towers = [];
    areas.forEach((a, i) => {
      const x = (i - (N - 1) / 2) * TW.SP;
      const h = Math.max(0.06, a.value * TW.HMAX);
      const g = new Group();
      g.position.set(x, 0, 0);
      const box = new BoxGeometry(TW.W, 1, TW.W); // one unit tall; the group is stretched to the real height
      box.translate(0, 0.5, 0);
      const bodyMat = new MeshBasicMaterial({ color: areaColor, map: bodyMap, transparent: true, opacity: 0.7, depthWrite: false });
      const body = new Mesh(box, bodyMat);
      body.userData.index = i;
      this.clickables.push(body);
      const edges = fatEdges(box, lighten(colors.area, 0.55), 1.7, 0.95, this.lineMats);
      const core = new Mesh(new BoxGeometry(0.13, 1, 0.13).translate(0, 0.5, 0), new MeshBasicMaterial({ color: areaColor, transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false }));
      const body3 = new Group(); // stretched part
      body3.add(body, edges, core);
      body3.scale.y = 0.001;
      const cap = new Mesh(new PlaneGeometry(TW.W, TW.W), new MeshBasicMaterial({ color: lighten(colors.area, 0.6), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
      cap.rotation.x = -Math.PI / 2;
      const capGlow = new Sprite(new SpriteMaterial({ map: glowTexture(), color: areaColor, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
      capGlow.scale.setScalar(1.5);
      const plate = new Mesh(new PlaneGeometry(TW.W * 1.5, TW.W * 1.5), new MeshBasicMaterial({ map: glowTexture(), color: areaColor, transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false }));
      plate.rotation.x = -Math.PI / 2; plate.position.y = 0.003;
      // the typical person in your country: a ring of light around the tower at their height
      const th = Math.max(0.03, a.typical * TW.HMAX);
      const ring = fatEdges(new BoxGeometry(TW.W + 0.24, 0.04, TW.W + 0.24), lighten(colors.typical, 0.2), 2.6, 1, this.lineMats);
      const ringFill = new Mesh(new PlaneGeometry(TW.W + 0.24, TW.W + 0.24), new MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.26, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
      ringFill.rotation.x = -Math.PI / 2;
      const typ = new Group(); typ.add(ring, ringFill); typ.position.y = th;
      g.add(plate, body3, cap, capGlow, typ);
      this.world.add(g);
      const tower = { g, body3, bodyMat, edgeMat: edges.material, cap, capGlow, typ, h, th, hover: 0, x, x0: x, z: 0, index: i };
      // labels: the value above the tower, the name with its icon on the floor in front
      tower.valEl = el('div', { class: 'c3-val' }, a.text);
      // on a narrow frame the label is a stack on the floor (the icon, a one-word name, the value), so nothing crowds the tops of the towers
      tower.nameEl = el('div', { class: 'c3-name' }, el('span', { class: 'c3-ico' }, a.icon ? a.icon.cloneNode(true) : null), el('span', { class: 'c3-nm' }, a.name), el('span', { class: 'c3-ns' }, a.short || a.name), el('b', { class: 'c3-nv' }, a.text));
      this.labelHost.append(tower.valEl, tower.nameEl);
      this.towers.push(tower);
    });

    // the wall behind the towers, with lines at a quarter, half, three quarters and everyone
    const xl = -(this.rowW / 2 + TW.W / 2 + TW.PAD_L), xr = this.rowW / 2 + TW.W / 2 + TW.PAD_R;
    this.wallX = [xl, xr];
    this.wallG = new Group();
    const wall = new Mesh(new PlaneGeometry(xr - xl, TW.HMAX), new MeshBasicMaterial({ color: 0xaab8ff, transparent: true, opacity: 0.05, depthWrite: false, side: DoubleSide }));
    wall.position.set((xl + xr) / 2, TW.HMAX / 2, TW.WALLZ);
    this.wallG.add(wall);
    const lines = (levels, width, opacity) => {
      const geo = new LineSegmentsGeometry();
      geo.setPositions(levels.flatMap((l) => [xl, l * TW.HMAX, TW.WALLZ, xr, l * TW.HMAX, TW.WALLZ]));
      const m = new LineMaterial({ color: new Color(0xc6d0ff), linewidth: width, transparent: true, opacity, depthWrite: false });
      this.lineMats.push(m);
      return new LineSegments2(geo, m);
    };
    this.wallG.add(lines([0.25, 0.75], 1, 0.16), lines([0.5, 1], 1.3, 0.36), lines([0], 1.2, 0.3));
    this.world.add(this.wallG);
    this.ticks = [[1, this.o.labels.all], [0.5, this.o.labels.half]].map(([lv, word]) => {
      const tick = el('div', { class: 'c3-tick' }, el('span', null, this.o.labels.ahead), el('b', null, word));
      this.labelHost.appendChild(tick);
      return { lv, el: tick };
    });

    // your place overall: a gold line across the wall at that height, ending at its label
    const xe = this.rowW / 2 + TW.W / 2 + 0.9;
    const goldLine = (width, opacity, color, blending) => {
      const geo = new LineSegmentsGeometry();
      geo.setPositions([xl, 0, TW.WALLZ + 0.02, xe, 0, TW.WALLZ + 0.02]);
      const m = new LineMaterial({ color: new Color(color), linewidth: width, transparent: true, opacity: 0, depthWrite: false, ...(blending ? { blending } : {}) });
      this.lineMats.push(m);
      return Object.assign(new LineSegments2(geo, m), { full: opacity });
    };
    const core = goldLine(3.2, 0.95, lighten(colors.you, 0.3), undefined), halo = goldLine(11, 0.2, colors.you, AdditiveBlending);
    this.overall = { g: new Group(), core, halo, y: overall.value * TW.HMAX, xe };
    this.overall.g.add(halo, core);
    this.wallG.add(this.overall.g);
    this.overallEl = el('div', { class: 'c3-over' }, el('b', null, overall.text), el('span', null, overall.name));
    this.labelHost.appendChild(this.overallEl);

    this.floor = buildFloor(this, { radius: 5.6, color: new Color(0x2fc9a0), rings: [3.6, 5.6, 7.8], dust: 100, dustHeight: 4.6 });
  }

  onResize() {
    // On a narrow frame the towers stand closer together, so the camera can come closer and they stay big.
    const aspect = this.camera.aspect;
    this.narrow = this.w < 600;
    this.container.classList.toggle('c3-narrow', this.narrow);
    const lower = this.narrow ? 0.4 : 0; // the key takes a row at the top of a narrow frame: the scene sits a little lower
    const room = this.narrow ? 2.2 : 1.2; // room under the towers for a second row of names (on a narrow frame the label is taller: icon, name and value)
    const extentY = TW.HMAX + 4.4 + lower * 2 + room;
    // Closer only as far as the frame's height needs: past that the picture cannot grow, so the spare width goes to the
    // gaps, and each label has room beside the next one.
    const k = this.narrow ? clamp((aspect * extentY - (TW.W + 1.4)) / this.rowW, 0.64, 1) : 1;
    this.k = k;
    this.towers.forEach((T) => { T.x = T.x0 * k; T.g.position.x = T.x; T.valW = 0; T.nameW = 0; }); // the label sizes are measured again on the next frame
    this.wallG.scale.x = k;
    this.target.set(0, TW.HMAX * 0.5 - 0.1 + lower - room / 2, -0.3);
    const extentX = this.narrow ? this.rowW * k + TW.W + 1.4 : (this.wallX[1] - this.wallX[0]) + 0.3;
    this.dist = this.fitDistance(extentX, extentY, 1.02);
  }

  // a point inside tower i, in pixels from the top left of the chart
  probe(i) {
    const T = this.towers[i];
    return this.toScreen(T.x, T.h * 0.5, 0);
  }

  onHoverChange() {}

  update(dt, t) {
    const reduced = this.reducedNow();
    const A = this.animT;
    const any = this.hover >= 0 || this.forced >= 0;
    this.towers.forEach((T, i) => {
      const p = reduced ? 1 : clamp((A - 0.15 - i * 0.12) / 0.95, 0, 1);
      const grow = ease.outBack(p);
      T.body3.scale.y = Math.max(0.001, T.h * grow);
      T.typ.position.y = T.th * grow;
      const fin = ease.outCubic(clamp((A - 0.15 - i * 0.12 - 0.6) / 0.5, 0, 1));
      const on = (this.hover === i || this.forced === i) ? 1 : 0;
      T.hover += (on - T.hover) * Math.min(1, dt * 10);
      const dim = any ? 1 - 0.5 * (1 - T.hover) : 1;
      T.bodyMat.opacity = (0.55 + 0.3 * T.hover) * ease.outCubic(p) * dim;
      T.edgeMat.opacity = (0.8 + 0.2 * T.hover) * ease.outCubic(p) * dim;
      T.cap.position.y = T.h * grow + 0.002;
      T.cap.material.opacity = (0.3 + 0.25 * T.hover + 0.1 * Math.sin(t * 2.2 + i)) * fin * dim;
      T.capGlow.position.y = T.h * grow + 0.15;
      T.capGlow.material.opacity = (0.55 + 0.3 * T.hover) * fin * dim;
      T.typ.visible = p > 0.7;
    });
    // the gold line rises to your overall height once the towers stand
    const op = reduced ? 1 : clamp((A - 1.3) / 0.9, 0, 1);
    const O = this.overall;
    O.g.position.y = O.y * ease.outCubic(op);
    O.core.material.opacity = O.core.full * op;
    O.halo.material.opacity = (O.halo.full + (reduced ? 0 : 0.06 * Math.sin(t * 2.2))) * op;
    this.floor.update(t, reduced);

    // a gentle sway, and the viewer can turn it a little; it eases back to the view the labels were placed for
    this.settle(dt);
    this.yawOff = clamp(this.yawOff, -0.9, 0.9);
    this.yaw = TW.YAW + (reduced ? 0 : Math.sin(t * 0.38) * 0.035) + this.yawOff;
    this.pitch = TW.PITCH + this.pitchOff;
  }

  afterRender() {
    const A = this.animT, reduced = this.reducedNow();
    // value labels: where each one wants to be, then moved apart left to right so none sits on another
    const spots = this.towers.map((T) => {
      if (!T.valW) { T.valW = T.valEl.offsetWidth; T.valH = T.valEl.offsetHeight; }
      const top = this.toScreen(T.x, T.body3.scale.y + 0.35, 0);
      return { x: top.x, y: top.y, w: T.valW, h: T.valH };
    });
    for (let pass = 0; pass < 3; pass++) {
      spots.forEach((a, i) => {
        for (let j = 0; j < i; j++) {
          const b = spots[j];
          const touching = Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 2 && a.y > b.y - b.h - 2 && a.y - a.h - 2 < b.y;
          if (touching) a.y = a.y >= b.y ? b.y + a.h + 2 : b.y - b.h - 2; // below it if it already sits lower, else above
        }
      });
    }
    // the names on the floor: two lanes, so a name that would touch one beside it drops a line, and no more than that
    const floor = this.towers.map((T) => {
      if (!T.nameW) {
        // the width of the words as drawn (a wrapped box is as wide as its limit, which would count gaps as collisions)
        const range = document.createRange(); range.selectNodeContents(this.narrow ? T.nameEl : T.nameEl.children[1]);
        T.nameW = Math.max(18, range.getBoundingClientRect().width, T.nameEl.firstElementChild ? T.nameEl.firstElementChild.offsetWidth : 0);
        T.nameH = T.nameEl.offsetHeight;
      }
      const b = this.toScreen(T.x, 0, 0.55);
      return { x: b.x, y: b.y, w: T.nameW, h: T.nameH };
    });
    const lanes = [[], []];
    floor.forEach((a) => {
      const fits = (k) => lanes[k].every((b) => Math.abs(a.x - b.x) >= (a.w + b.w) / 2 + 4);
      const k = fits(0) ? 0 : fits(1) ? 1 : 0;
      if (k) a.y += a.h + 2;
      lanes[k].push(a);
    });
    this.towers.forEach((T, i) => {
      const show = reduced ? 1 : ease.outCubic(clamp((A - 0.15 - i * 0.12 - 0.5) / 0.6, 0, 1));
      T.valEl.style.transform = `translate(${spots[i].x}px, ${spots[i].y}px) translate(-50%, -100%)`;
      T.valEl.style.opacity = String(show);
      T.nameEl.style.transform = `translate(${floor[i].x}px, ${floor[i].y}px) translate(-50%, 0)`;
      T.nameEl.style.opacity = String(show);
      T.valEl.classList.toggle('hot', this.hover === i || this.forced === i);
      T.nameEl.classList.toggle('hot', this.hover === i || this.forced === i);
    });
    // the scale on the wall: at the left end, just above each line
    const tickShow = reduced ? 1 : clamp((A - 0.2) / 0.6, 0, 1);
    this.ticks.forEach((tk) => {
      const p = this.toScreen(this.wallX[0] * this.k + 0.14, tk.lv * TW.HMAX, TW.WALLZ);
      tk.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(0, -112%)`;
      tk.el.style.opacity = String(tickShow);
    });
    // your place overall: at the right end of the gold line
    const O = this.overall, os = reduced ? 1 : clamp((A - 1.8) / 0.5, 0, 1);
    const right = this.toScreen(O.xe * this.k + 0.14, O.g.position.y, TW.WALLZ);
    // on a narrow frame the label ends at the end of the line, but never past the frame, so its last letters are not cut off
    const rx = this.narrow ? Math.min(right.x, this.w - 10) : right.x;
    this.overallEl.style.transform = this.narrow ? `translate(${rx}px, ${right.y}px) translate(-100%, -128%)` : `translate(${right.x}px, ${right.y}px) translate(0, -50%)`;
    this.overallEl.style.opacity = String(os);
  }
}

HLIA.Pyramid3D = Pyramid3D;
HLIA.Towers3D = Towers3D;
