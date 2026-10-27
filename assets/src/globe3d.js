/* The 3D globe, built with three.js. Bundled into assets/js/globe3d.js by `npm run build:3d`.

   One scene shows the same people dots as the 2D field, on a sphere:
     - the dots sit where people live (longitude and latitude from the build step)
     - a gold beacon marks you; a wave turns everyone behind you emerald, poorest first
     - the dots can lift off the globe into a "skyline" of towers, one tower per income step
     - spinTo() turns the globe to a random person for the birth lottery
   Everything reads window.HLIA (people, model, GLOBE_DATA). Nothing is fetched. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, SphereGeometry, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Mesh, CanvasTexture, Vector3, Quaternion, AdditiveBlending,
  BackSide, CylinderGeometry, RingGeometry, LinearMipmapLinearFilter, LinearFilter, MeshBasicMaterial, MathUtils,
} from 'three';

import './charts3d.js';

const HLIA = window.HLIA;
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const FOV = 34;
const LOG_LO = Math.log10(0.5);
const LOG_HI = Math.log10(1000);

const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const hex = (s) => { const c = parseInt(s.replace('#', ''), 16); return [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255]; };
const lonLatToVec = (lon, lat, r = 1, out = new Vector3()) => {
  const la = lat * D2R, lo = lon * D2R;
  return out.set(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
};

// ---------- shaders ----------
const POINTS_VS = `
attribute vec3 aSky;
attribute float aRank;
attribute float aBehind;
attribute float aDelay;
attribute float aSeed;
uniform float uMix, uWave, uAhead, uHasUser, uSizeG, uSizeS, uScale, uTime, uAlpha;
uniform vec3 uNeutral, uBehindCol, uAheadCol;
varying vec3 vColor;
varying float vA;
void main() {
  float p = clamp((uMix - aDelay) / 0.62, 0.0, 1.0);
  float e = p * p * (3.0 - 2.0 * p);
  vec3 pos = mix(position, aSky, e);
  pos += normalize(position) * sin(3.14159265 * e) * (0.2 + 0.4 * aSeed);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.82 + 0.18 * sin(uTime * 1.4 + aSeed * 60.0);
  float size = mix(uSizeG, uSizeS, e);
  gl_PointSize = max(1.2, size * uScale / -mv.z);
  bool lit = uHasUser > 0.5 && aBehind > 0.5 && aRank < uWave;
  vec3 col = uNeutral;
  if (uHasUser > 0.5) col = lit ? uBehindCol : mix(uNeutral, uAheadCol, uAhead);
  vColor = col;
  vA = uAlpha * (lit ? 1.0 : mix(1.0, 0.8, uAhead)) * mix(tw, 1.0, e);
}`;
const POINTS_FS = `
varying vec3 vColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.04, d);
  float a = pow(core, 1.5) * vA;
  gl_FragColor = vec4(vColor * (0.55 + 0.9 * core), a);
}`;
const SPHERE_VS = `
varying vec3 vPos; varying vec3 vN; varying vec3 vV;
void main() {
  vPos = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SPHERE_FS = `
uniform sampler2D uLand;
uniform vec3 uBase, uRim;
uniform float uOpacity;
varying vec3 vPos; varying vec3 vN; varying vec3 vV;
void main() {
  vec3 p = normalize(vPos);
  float lon = atan(p.x, p.z);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  vec4 land = texture2D(uLand, vec2(lon / 6.2831853 + 0.5, lat / 3.14159265 + 0.5));
  vec3 col = mix(uBase, land.rgb, land.a);
  float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
  col += uRim * fres * 0.9;
  gl_FragColor = vec4(col, uOpacity);
}`;
const ATMO_VS = `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ATMO_FS = `uniform vec3 uColor; uniform float uOpacity; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.72 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.2); gl_FragColor = vec4(uColor, 1.0) * i * uOpacity; }`;
const BEAM_VS = `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BEAM_FS = `uniform vec3 uColor; uniform float uOpacity; uniform float uLen; varying float vY; void main(){ float t = clamp(vY / uLen, 0.0, 1.0); gl_FragColor = vec4(uColor, pow(1.0 - t, 1.6) * uOpacity); }`;

export class Globe3D {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = Object.assign({ reduced: false, onHover: null, onFrame: null }, opts);
    this.P = HLIA.people;
    this.G = HLIA.GLOBE_DATA;
    this.model = HLIA.model;
    this.tweens = [];
    this.user = null;
    this.mode = 'globe';
    this.hover = -1;
    this.autoRotate = !this.opts.reduced;
    this.rot = { y: 0.4, x: 0.25, vy: 0 };
    this.dragging = false;
    this.lastTouch = 0;
    this.camTarget = new Vector3(0, 0, 0);
    this.camLocks = 0; // how many camera moves are running (a getter below says whether any is)
    this.camToken = 0; // changes when a newer camera move takes over from an older one
    this.waveId = 0; // changes when a wave is skipped, so the one that was running stops where it is
    this.camDist = 5.2;
    this.visible = true;
    this.t0 = performance.now();
    this.mix = 0;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('webgl');
    this.renderer = renderer;
    renderer.setClearColor(0x000000, 0);
    this.canvas = renderer.domElement;
    this.canvas.className = 'globe-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(this.canvas);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
    this.world = new Group();
    this.scene.add(this.world);

    this.colors = {
      neutral: hex(HLIA.util.cssVar('--ramp-v3') || '#a397f6'),
      behind: hex(HLIA.util.cssVar('--ahead') || '#35d6a0'),
      ahead: hex('#6b76c4'),
      you: HLIA.util.cssVar('--you') || '#ffc14d',
    };

    this.buildLand();
    this.buildSphere();
    this.buildPoints();
    this.buildSkyline();
    this.buildBeacon();
    // Everything here is transparent, so draw order is set by hand: planet, glow, lights, beacons.
    this.sphere.renderOrder = 0;
    this.atmo.renderOrder = 1;
    this.points.renderOrder = 3;
    for (const b of [this.youBeacon, this.pinBeacon, this.skyBeacon]) b.children.forEach((m) => { m.renderOrder = 5; });
    this.bind();
    this.resize();
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }

  // ---------- land texture ----------
  buildLand() {
    const G = this.G;
    this.landCanvas = document.createElement('canvas');
    this.landCanvas.width = G.w; this.landCanvas.height = G.h;
    this.landCtx = this.landCanvas.getContext('2d');
    this.landPaths = G.shapes.map(([key, d]) => ({ key, path: new Path2D(d) }));
    this.landTex = new CanvasTexture(this.landCanvas);
    this.landTex.minFilter = LinearMipmapLinearFilter;
    this.landTex.magFilter = LinearFilter;
    this.landTex.anisotropy = 4;
    this.paintLand(null);
  }
  // colors: { ISO3: '#rrggbb' } fills; countries not listed keep the quiet silhouette
  paintLand(colors, { fade = 0.0 } = {}) {
    const ctx = this.landCtx, G = this.G;
    ctx.clearRect(0, 0, G.w, G.h);
    ctx.lineJoin = 'round';
    for (const s of this.landPaths) {
      const c = colors && colors[s.key];
      ctx.fillStyle = c || 'rgba(120,135,255,0.17)';
      ctx.fill(s.path);
    }
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = colors ? 'rgba(7,10,28,0.85)' : 'rgba(150,165,255,0.14)';
    for (const s of this.landPaths) ctx.stroke(s.path);
    this.landTex.needsUpdate = true;
  }

  buildSphere() {
    const geo = new SphereGeometry(1, 96, 64);
    this.sphereMat = new ShaderMaterial({
      vertexShader: SPHERE_VS, fragmentShader: SPHERE_FS, transparent: true,
      uniforms: { uLand: { value: this.landTex }, uBase: { value: hex('#0a0f2c') }, uRim: { value: hex('#3a4fd0') }, uOpacity: { value: 1 } },
    });
    this.sphere = new Mesh(geo, this.sphereMat);
    this.world.add(this.sphere);
    this.atmoMat = new ShaderMaterial({
      vertexShader: ATMO_VS, fragmentShader: ATMO_FS, side: BackSide, blending: AdditiveBlending, transparent: true, depthWrite: false,
      uniforms: { uColor: { value: hex('#5b6bff') }, uOpacity: { value: 0.75 } },
    });
    this.atmo = new Mesh(new SphereGeometry(1.16, 64, 48), this.atmoMat);
    this.scene.add(this.atmo);
  }

  // ---------- the people ----------
  buildPoints() {
    const P = this.P, n = P.n;
    const b = atob(this.G.lonlat);
    const u8 = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    const ll = new Int16Array(u8.buffer);
    this.globePos = new Float32Array(n * 3);
    const v = new Vector3();
    for (let i = 0; i < n; i++) {
      lonLatToVec(ll[2 * i] / 100, ll[2 * i + 1] / 100, 1.004, v);
      this.globePos[3 * i] = v.x; this.globePos[3 * i + 1] = v.y; this.globePos[3 * i + 2] = v.z;
    }
    this.skyPos = new Float32Array(n * 3);
    this.rankA = new Float32Array(n);
    this.behindA = new Float32Array(n);
    this.delayA = new Float32Array(n);
    this.seedA = new Float32Array(n);
    const rnd = HLIA.util.rng(4242);
    for (let i = 0; i < n; i++) { this.rankA[i] = P.rank[i] / (n - 1); this.seedA[i] = rnd(); this.delayA[i] = 0.36 * rnd(); }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.globePos, 3));
    geo.setAttribute('aSky', new BufferAttribute(this.skyPos, 3));
    geo.setAttribute('aRank', new BufferAttribute(this.rankA, 1));
    geo.setAttribute('aBehind', new BufferAttribute(this.behindA, 1));
    geo.setAttribute('aDelay', new BufferAttribute(this.delayA, 1));
    geo.setAttribute('aSeed', new BufferAttribute(this.seedA, 1));
    geo.boundingSphere = null;
    this.pointsMat = new ShaderMaterial({
      vertexShader: POINTS_VS, fragmentShader: POINTS_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: {
        uMix: { value: 0 }, uWave: { value: 0 }, uAhead: { value: 0 }, uHasUser: { value: 0 }, uSizeG: { value: 0.0155 }, uSizeS: { value: 0.021 },
        uScale: { value: 400 }, uTime: { value: 0 }, uAlpha: { value: 1 },
        uNeutral: { value: this.colors.neutral }, uBehindCol: { value: this.colors.behind }, uAheadCol: { value: this.colors.ahead },
      },
    });
    this.points = new Points(geo, this.pointsMat);
    this.points.frustumCulled = false;
    this.world.add(this.points);
  }

  // The skyline: one tower of dots for each step of daily income (log scale).
  buildSkyline() {
    const P = this.P, n = P.n;
    const B = 66, bw = 0.05, s = bw / 2, rowH = s * 0.9;
    const counts = new Uint16Array(B);
    const fill = new Uint16Array(B);
    const bin = (z) => clamp(Math.floor(((Math.log10(Math.max(z, 0.01)) - LOG_LO) / (LOG_HI - LOG_LO)) * B), 0, B - 1);
    for (let i = 0; i < n; i++) counts[bin(P.z[i])]++;
    const x0 = -(B * bw) / 2, baseY = -0.62;
    for (let r = 0; r < n; r++) {
      const i = P.order[r];
      const b = bin(P.z[i]);
      const k = fill[b]++;
      const layer = Math.floor(k / 4), j = k % 4;
      this.skyPos[3 * i] = x0 + b * bw + ((j % 2) + 0.5) * s;
      this.skyPos[3 * i + 1] = baseY + (layer + 0.5) * rowH;
      this.skyPos[3 * i + 2] = (Math.floor(j / 2) - 0.5) * s;
    }
    let maxCount = 0;
    for (let b = 0; b < B; b++) if (counts[b] > maxCount) maxCount = counts[b];
    this.sky = {
      B, bw, x0, baseY, rowH, counts, topMax: baseY + Math.ceil(maxCount / 4) * rowH,
      xOfZ: (z) => x0 + ((Math.log10(clamp(z, 0.5, 1000)) - LOG_LO) / (LOG_HI - LOG_LO)) * B * bw,
      topOfZ: (z) => baseY + Math.ceil(counts[bin(z)] / 4) * rowH,
      width: B * bw,
    };
  }

  // ---------- beacons (you, and a lottery pin) ----------
  makeBeacon(color) {
    const g = new Group();
    const len = 0.34;
    const cyl = new CylinderGeometry(0.0035, 0.0035, len, 10, 1, true);
    cyl.translate(0, len / 2, 0);
    const beam = new Mesh(cyl, new ShaderMaterial({
      vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uColor: { value: hex(color) }, uOpacity: { value: 0.9 }, uLen: { value: len } },
    }));
    const core = new Mesh(new SphereGeometry(0.012, 20, 14), new MeshBasicMaterial({ color }));
    const ringGeo = new RingGeometry(0.014, 0.019, 48); ringGeo.rotateX(-Math.PI / 2);
    const ring = new Mesh(ringGeo, new MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, blending: AdditiveBlending }));
    g.add(beam, core, ring);
    g.userData = { ring, beam };
    g.visible = false;
    this.world.add(g);
    return g;
  }
  placeBeacon(g, lon, lat, lift = 1.004) {
    const n = lonLatToVec(lon, lat, 1);
    g.position.copy(n).multiplyScalar(lift);
    g.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), n);
    g.visible = true;
  }
  buildBeacon() {
    this.youBeacon = this.makeBeacon(this.colors.you);
    this.pinBeacon = this.makeBeacon('#8fe9ff');
    this.skyBeacon = this.makeBeacon(this.colors.you); // the same gold beacon, standing on your tower
  }

  // ---------- events ----------
  bind() {
    const c = this.canvas;
    c.style.touchAction = 'pan-y';
    let lx = 0, ly = 0, moved = 0;
    this.onDown = (e) => { this.dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; try { c.setPointerCapture(e.pointerId); } catch (err) { /* not an active pointer */ } this.rot.vy = 0; };
    this.onMove = (e) => {
      if (this.dragging) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (this.mode === 'globe') {
          this.rot.y += dx * 0.0055; this.rot.vy = dx * 0.0055;
          this.rot.x = clamp(this.rot.x + dy * 0.0045, -1.2, 1.2);
        } else {
          this.skyYaw = clamp((this.skyYaw || 0) + dx * 0.004, -0.9, 0.9);
        }
        this.lastTouch = performance.now();
        this.setHover(-1);
      } else this.pick(e);
    };
    this.onUp = () => { this.dragging = false; };
    this.onLeave = () => { this.setHover(-1); };
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onLeave);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { threshold: 0 });
    this.io.observe(this.container);
    this.onVis = () => { this.visible = !document.hidden; };
  }

  // Move the canvas into a new container (the page is rebuilt when the language changes).
  attach(container) {
    this.ro && this.ro.disconnect();
    this.io && this.io.disconnect();
    this.container = container;
    container.appendChild(this.canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; }, { threshold: 0 });
    this.io.observe(container);
    this.resize();
  }

  resize() {
    const r = this.container.getBoundingClientRect();
    const w = Math.max(200, Math.round(r.width)), h = Math.max(200, Math.round(r.height));
    this.w = w; this.h = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h;
    // opts.shift(w, h) returns { globe, sky }: how far to slide the picture sideways, as a share of the
    // width, so it sits beside a text card instead of behind it. Positive moves it right.
    this.shiftCfg = this.opts.shift ? this.opts.shift(w, h) : { globe: 0, sky: 0 };
    this.curShift = null;
    this.applyShift();
    this.pointsMat.uniforms.uScale.value = (h * dpr) / (2 * Math.tan((FOV * D2R) / 2));
    this.pointsMat.uniforms.uSizeG.value = 0.0155 * (w < 520 ? 1.15 : 1);
    this.fitCamera();
  }
  applyShift() {
    const c = this.shiftCfg || { globe: 0, sky: 0 };
    const sh = c.globe + (c.sky - c.globe) * this.mix;
    if (this.curShift !== null && Math.abs(sh - this.curShift) < 1e-4) return;
    this.curShift = sh;
    if (Math.abs(sh) < 1e-4) this.camera.clearViewOffset();
    else this.camera.setViewOffset(this.w, this.h, -this.w * sh, 0, this.w, this.h);
    this.camera.updateProjectionMatrix();
  }
  // Pull the camera back far enough that the globe (or the skyline) fits the frame.
  fitCamera() {
    const fv = FOV * D2R, fh = 2 * Math.atan(Math.tan(fv / 2) * this.camera.aspect);
    // opts.shift may also say how much of the width is free beside a text card (globeW, skyW, as shares of the
    // width). The globe is fitted to its strip, so the whole planet and its glow stay clear of the card.
    const cfg = this.shiftCfg || {};
    const stripAspect = cfg.globeW ? Math.min(this.camera.aspect, (cfg.globeW * this.w) / this.h) : this.camera.aspect;
    const fhGlobe = 2 * Math.atan(Math.tan(fv / 2) * stripAspect);
    const globe = 1.18 / Math.sin(Math.min(fv, fhGlobe) / 2);
    // the skyline must fit across and up: width of the towers, and the height of the tallest one
    const skyH = this.sky.topMax - this.sky.baseY + 0.45; // room for the beacon and a margin
    const share = cfg.skyW ? MathUtils.clamp(cfg.skyW, 0.25, 0.9) : Math.abs(cfg.sky || 0) > 0.01 ? 0.55 : 0;
    const distW = share ? (this.sky.width + 0.5) / share / (2 * Math.tan(fh / 2)) + 0.4 : (this.sky.width / 2 + 0.3) / Math.tan(fh / 2) + 0.6;
    // the axis labels (dollar ticks, world median, axis title) hang below the base, about 80px of the stage
    const reserve = Math.min(0.3, 80 / this.h);
    const distH = skyH / (2 * Math.tan(fv / 2) * (1 - reserve)) + 0.6;
    const skyDist = Math.max(distW, distH, 3.4);
    // look at the middle of what is left once the label rows are taken off the bottom
    this.skyCenterY = this.sky.baseY + (this.sky.topMax - this.sky.baseY) / 2 + 0.05 - reserve * skyDist * Math.tan(fv / 2);
    this.fit = { globe: globe * 1.02, sky: skyDist };
    if (!this.camTween) this.camDist = this.mode === 'skyline' ? this.fit.sky : this.fit.globe;
  }

  get camTween() { return this.camLocks > 0; }
  lockCam(on) { this.camLocks = Math.max(0, this.camLocks + (on ? 1 : -1)); }

  // ---------- animation helpers ----------
  tween(ms, fn, easing = ease.outCubic) {
    return new Promise((resolve) => {
      if (this.opts.reduced || HLIA.util.reducedMotion() || ms <= 0) { fn(1); resolve(); return; }
      this.tweens.push({ t0: performance.now(), ms, fn, easing, resolve });
    });
  }
  stepTweens(now) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const t = this.tweens[i];
      const k = clamp((now - t.t0) / t.ms, 0, 1);
      t.fn(t.easing(k));
      if (k >= 1) { this.tweens.splice(i, 1); t.resolve(); }
    }
  }

  // ---------- the story ----------
  setUser(user) {
    this.user = user; // { z, id }
    const P = this.P;
    for (let i = 0; i < P.n; i++) this.behindA[i] = user && P.z[i] < user.z ? 1 : 0;
    this.points.geometry.attributes.aBehind.needsUpdate = true;
    this.pointsMat.uniforms.uHasUser.value = user ? 1 : 0;
    this.pointsMat.uniforms.uWave.value = user ? 1.01 : 0;
    this.pointsMat.uniforms.uAhead.value = user ? 1 : 0;
    const ll = user && this.G.centLL[user.id];
    if (ll) this.placeBeacon(this.youBeacon, ll[0], ll[1]);
    else this.youBeacon.visible = false;
    this.youLL = ll || null;
    if (user) {
      this.skyBeacon.position.set(this.sky.xOfZ(user.z), this.sky.topOfZ(user.z) + 0.03, 0);
      this.skyBeacon.quaternion.identity();
    }
  }
  // Rotate so that a place faces the camera.
  faceTo(lon, lat) { return { y: -lon * D2R, x: lat * D2R }; }
  flyTo(lon, lat, ms = 1800) {
    const f = this.faceTo(lon, lat);
    const y0 = this.rot.y, x0 = this.rot.x;
    // shortest way round
    let dy = ((f.y - y0) % TAU + TAU) % TAU; if (dy > Math.PI) dy -= TAU;
    this.rot.vy = 0;
    return this.tween(ms, (e) => { this.rot.y = y0 + dy * e; this.rot.x = x0 + (f.x - x0) * e; }, ease.inOutCubic);
  }
  // Opening move: start far and face the user's country.
  async flyIn(ms = 2600) {
    const d0 = this.fit.globe * 2.3;
    const token = ++this.camToken;
    this.lockCam(true);
    const home = this.youLL || [0, 20];
    const f = this.faceTo(home[0], home[1] * 0.8);
    this.rot.y = f.y + 1.6; this.rot.x = 0.1;
    this.camDist = d0;
    const y0 = this.rot.y, x0 = this.rot.x;
    await this.tween(ms, (e) => {
      // the end point follows the current mode (a reload can start the page already scrolled to the skyline)
      const d1 = this.mode === 'skyline' ? this.fit.sky : this.fit.globe;
      if (token === this.camToken) this.camDist = d0 + (d1 - d0) * ease.outExpo(e);
      this.rot.y = y0 + (f.y - y0) * e;
      this.rot.x = x0 + (f.x * 0.8 - x0) * e;
    }, (t) => ease.inOutSine(t));
    this.lockCam(false);
  }
  // Turn the lights behind you emerald, poorest first. onProgress(share 0..1 of all people lit).
  async wave(ms = 3600, onProgress) {
    if (!this.user) return;
    const id = ++this.waveId;
    const target = this.P.countBelow(this.user.z) / this.P.n;
    const u = this.pointsMat.uniforms;
    u.uAhead.value = 0;
    u.uWave.value = 0;
    await this.tween(ms, (e) => {
      u.uWave.value = e * Math.max(target, 0.001) * 1.0001;
      if (onProgress) onProgress(e * target, e);
    }, ease.inOutSine);
    if (id !== this.waveId) return; // skipped: the lights are already all on
    u.uWave.value = 1.01;
    await this.tween(900, (e) => { if (id === this.waveId) u.uAhead.value = e; });
  }
  // Skip: every move that is running jumps to its end (the camera too), and a wave on its way is over at once.
  finishAll() {
    this.waveId++;
    const running = this.tweens.splice(0);
    for (const t of running) { t.fn(t.easing(1)); t.resolve(); }
    this.setWaveInstant();
  }
  setWaveInstant() { if (this.user) { this.pointsMat.uniforms.uWave.value = 1.01; this.pointsMat.uniforms.uAhead.value = 1; } }

  // 'globe' or 'skyline'
  async setMode(mode, ms = 2800) {
    if (mode === this.mode && this.mix === (mode === 'skyline' ? 1 : 0)) return;
    const from = this.mix, to = mode === 'skyline' ? 1 : 0;
    const d0 = this.camDist, d1 = mode === 'skyline' ? this.fit.sky : this.fit.globe;
    const ty0 = this.camTarget.y, ty1 = mode === 'skyline' ? this.skyCenterY : 0;
    this.mode = mode;
    const token = ++this.camToken;
    this.lockCam(true);
    const fadeTo = mode === 'skyline' ? 0 : 1;
    const o0 = this.sphereMat.uniforms.uOpacity.value;
    await this.tween(ms, (e) => {
      this.mix = from + (to - from) * e;
      this.pointsMat.uniforms.uMix.value = this.mix;
      if (token === this.camToken) { this.camDist = d0 + (d1 - d0) * e; this.camTarget.y = ty0 + (ty1 - ty0) * e; }
      const sOp = o0 + (fadeTo - o0) * clamp(mode === 'skyline' ? e * 2.2 : (e - 0.35) / 0.65, 0, 1);
      this.setPlanetOpacity(sOp);
    }, ease.inOutCubic);
    this.lockCam(false);
    this.skyYaw = this.skyYaw || 0;
    this.grid = null;
  }

  // The planet fades out for the skyline. A faded planet must not hide dots behind it, so it stops
  // writing depth as soon as it is not fully solid.
  setPlanetOpacity(o) {
    this.sphereMat.uniforms.uOpacity.value = o;
    this.sphereMat.depthWrite = o > 0.97;
    this.sphere.visible = o > 0.01;
    this.atmoMat.uniforms.uOpacity.value = 0.75 * o;
    this.atmo.visible = o > 0.01;
  }

  // Lottery: spin to a person and drop a pin.
  async spinTo(lon, lat, { ms = 3600, turns = 2 } = {}) {
    this.pinBeacon.visible = false;
    this.autoRotate = false;
    const f = this.faceTo(lon, lat);
    const y0 = this.rot.y, x0 = this.rot.x;
    let dy = ((f.y - y0) % TAU + TAU) % TAU; if (dy > Math.PI) dy -= TAU;
    dy -= TAU * turns;
    // ease in a little toward the pin, but keep the whole planet and its glow inside the frame
    const d0 = this.camDist, d1 = this.fit.globe * 0.92;
    this.lockCam(true);
    await this.tween(ms, (e) => {
      this.rot.y = y0 + dy * e; this.rot.x = x0 + (f.x - x0) * e;
      this.camDist = d0 + (d1 - d0) * ease.outCubic(e);
    }, ease.outQuart);
    this.placeBeacon(this.pinBeacon, lon, lat);
    this.pinBeacon.userData.t0 = performance.now();
    await this.tween(700, (e) => { this.pinBeacon.scale.setScalar(0.2 + 0.8 * ease.outExpo(e)); }, (t) => t);
    this.lockCam(false);
  }
  releasePin() { this.pinBeacon.visible = false; this.camDist = this.fit.globe; }

  // longitude and latitude (degrees) of one dot
  dotLonLat(i) {
    const x = this.globePos[3 * i], y = this.globePos[3 * i + 1], z = this.globePos[3 * i + 2];
    return [Math.atan2(x, z) / D2R, Math.asin(clamp(y / Math.hypot(x, y, z), -1, 1)) / D2R];
  }

  // ---------- projecting and picking ----------
  project(x, y, z) {
    const v = new Vector3(x, y, z).applyMatrix4(this.world.matrixWorld).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h, z: v.z };
  }
  // screen position of the "you" dot, for labels
  youScreen() {
    if (!this.user) return null;
    if (this.mode === 'skyline' && this.mix > 0.98) {
      const x = this.sky.xOfZ(this.user.z), y = this.sky.topOfZ(this.user.z) + 0.05;
      const p = this.project(x, y, 0);
      return { ...p, visible: true };
    }
    if (!this.youLL) return null;
    const v = lonLatToVec(this.youLL[0], this.youLL[1], 1.004);
    const w = v.clone().applyQuaternion(this.world.quaternion);
    const p = this.project(v.x, v.y, v.z);
    return { ...p, visible: w.z > 0.05 };
  }
  pick(e) {
    if (this.mode !== 'globe' || this.mix > 0.02 || !this.opts.onHover || this.camTween) return;
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const m = this.world.matrixWorld, cam = this.camera;
    const gp = this.globePos, n = this.P.n;
    let best = -1, bd = 14 * 14;
    const v = new Vector3();
    const camLocal = this.camera.position.clone().applyMatrix4(this.world.matrixWorld.clone().invert());
    for (let i = 0; i < n; i++) {
      const x = gp[3 * i], y = gp[3 * i + 1], z = gp[3 * i + 2];
      // facing the camera?
      if (x * camLocal.x + y * camLocal.y + z * camLocal.z < 1.0) continue;
      v.set(x, y, z).applyMatrix4(m).project(cam);
      const sx = (v.x * 0.5 + 0.5) * this.w, sy = (-v.y * 0.5 + 0.5) * this.h;
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    this.setHover(best, e.clientX, e.clientY);
  }
  setHover(i, cx, cy) {
    if (i === this.hover && i < 0) return;
    this.hover = i;
    if (this.opts.onHover) this.opts.onHover(i < 0 ? null : { index: i, clientX: cx, clientY: cy });
  }

  // ---------- frame ----------
  tick(now) {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.visible || document.hidden) return;
    const t = (now - this.t0) / 1000;
    this.stepTweens(now);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    // inertia and slow drift
    if (this.mode === 'globe' && !this.dragging && !this.camTween) {
      if (Math.abs(this.rot.vy) > 1e-5) { this.rot.y += this.rot.vy; this.rot.vy *= 0.94; }
      else if (this.autoRotate && !HLIA.util.reducedMotion() && now - this.lastTouch > 2500) this.rot.y += dt * 0.07;
    }
    this.world.rotation.set(this.rot.x, this.mode === 'skyline' ? 0 : this.rot.y, 0, 'XYZ');
    // blend the world rotation out as the skyline comes in
    if (this.mix > 0) {
      const k = 1 - this.mix;
      // the skyline sways a little so its depth shows; dragging turns it
      const sway = this.opts.reduced || HLIA.util.reducedMotion() ? 0 : Math.sin(t * 0.32) * 0.3;
      this.world.rotation.set(this.rot.x * k, this.rot.y * k + ((this.skyYaw || 0) + sway) * this.mix, 0, 'XYZ');
    }
    // beacons: your globe beacon, your tower beacon
    this.youBeacon.visible = !!this.youLL && this.mix < 0.4 && this.sphere.visible;
    this.skyBeacon.visible = !!this.user && this.mix > 0.97;
    this.world.updateMatrixWorld(true);
    this.camera.position.set(this.camTarget.x, this.camTarget.y + this.mix * 0.35, this.camDist);
    this.camera.lookAt(this.camTarget);
    this.pointsMat.uniforms.uTime.value = t;
    this.applyShift();
    // pulse the rings
    for (const b of [this.youBeacon, this.pinBeacon, this.skyBeacon]) {
      if (!b.visible) continue;
      const k = (t * 0.7) % 1;
      const ring = b.userData.ring;
      ring.scale.setScalar(1 + k * 3.2);
      ring.material.opacity = 0.65 * (1 - k);
    }
    this.renderer.render(this.scene, this.camera);
    if (this.opts.onFrame) this.opts.onFrame(this);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro && this.ro.disconnect();
    this.io && this.io.disconnect();
    this.tweens.length = 0;
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose && o.material.dispose(); });
    this.landTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss && this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

HLIA.Globe3D = Globe3D;
