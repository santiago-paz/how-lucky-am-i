/* Lottie animations: small and decorative, played with lottie-web (the light SVG build).
   The player and the files load the first time one is needed. Nothing here is required to use the site:
   if the player cannot load, or the viewer asks for less motion, the page simply shows a still picture. */
(function (global) {
  'use strict';
  const HLIA = global.HLIA;
  const { el } = HLIA.util;

  let player = null;
  const files = {};

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }
  const lib = () => player || (player = loadScript('assets/js/vendor/lottie_light.min.js').then(() => global.lottie || null).catch(() => null));
  const data = (name) => files[name] || (files[name] = fetch('assets/lottie/' + name + '.json').then((r) => r.json()).catch(() => null));
  const reduced = () => HLIA.util.reducedMotion();

  // Play one animation inside a container. A picture already in the container (a plain icon) stays
  // until the animation is ready, and is the fallback if it never is.
  async function mount(name, container, { loop = false, autoplay = true, fit = 'xMidYMid meet' } = {}) {
    const [lottie, json] = await Promise.all([lib(), data(name)]);
    if (!lottie || !json || !container.isConnected) return null;
    container.replaceChildren();
    return lottie.loadAnimation({
      container, renderer: 'svg', loop, autoplay,
      animationData: JSON.parse(JSON.stringify(json)), // the player edits the data it is given
      rendererSettings: { preserveAspectRatio: fit },
    });
  }

  // Run fn when the element first comes into view.
  function whenSeen(node, fn, threshold = 0.5) {
    if (typeof IntersectionObserver === 'undefined') { fn(); return; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold });
    io.observe(node);
  }
  // A looping animation only needs to run while it can be seen.
  function pauseOffscreen(anim, node) {
    if (!anim || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) anim.play(); else anim.pause(); });
    io.observe(node);
  }

  const fx = {
    // Fetch the player and some files ahead of time, so they are ready when the moment comes.
    preload(...names) { lib(); names.forEach(data); },

    // A four-leaf clover that pops in and then sways for as long as it is on screen.
    async clover(node) {
      const a = await mount('clover', node, { autoplay: false });
      if (!a) return null;
      if (reduced()) { a.goToAndStop(70, true); return a; }
      a.playSegments([0, 56], true);
      a.addEventListener('complete', () => { a.loop = true; a.playSegments([56, 190], true); });
      pauseOffscreen(a, node);
      return a;
    },

    // A disc with a check mark that draws itself the first time it is seen.
    check(node) {
      whenSeen(node, async () => {
        const a = await mount('check', node, { autoplay: false });
        if (!a) return;
        if (reduced()) a.goToAndStop(56, true); else a.play();
      }, 0.6);
    },

    // Stars that twinkle, for as long as they can be seen.
    async sparkles(node) {
      const a = await mount('sparkles', node, { loop: true, autoplay: !reduced() });
      if (!a) return null;
      if (reduced()) a.goToAndStop(40, true); else pauseOffscreen(a, node);
      return a;
    },

    // A chevron that bobs down and back.
    async arrow(node) {
      const a = await mount('arrow', node, { loop: true, autoplay: !reduced() });
      if (!a) return null;
      if (reduced()) a.goToAndStop(50, true); else pauseOffscreen(a, node);
      return a;
    },
  };

  HLIA.fx = fx;
})(window);
