import './styles/base.css';
import './styles/cube.css';
import './styles/panel.css';

import { PerspectiveCamera } from 'three';

import { FACES } from './cube/orientation.js';
import { createCubeLayer } from './cube/css3d.js';
import { createLayout } from './cube/layout.js';
import { createControls } from './cube/controls.js';
import { createNav } from './ui/nav.js';
import { createPanel } from './ui/panel.js';
import { createFaceA11y } from './ui/a11y.js';
import { createI18n, rememberLang, storedLang } from './i18n.js';

const root = document.documentElement;

function boot() {
  const stage = document.getElementById('stage');
  const glLayer = document.getElementById('gl-layer');
  const css3dLayer = document.getElementById('css3d-layer');
  const facesHome = document.getElementById('faces');
  const navElement = document.getElementById('face-nav');
  const liveRegion = document.getElementById('live-region');
  const viewToggle = document.getElementById('view-toggle');

  const sections = FACES.map((face) => {
    const element = facesHome.querySelector(`[data-face="${face.id}"]`);
    if (!element) throw new Error(`No markup for face "${face.id}"`);
    return element;
  });

  const i18n = createI18n(document);
  i18n.apply(storedLang());

  const faceLabel = (index) => sections[index]?.dataset.label ?? '';
  const labels = () => sections.map((section) => section.dataset.label ?? '');

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionQuery.matches;

  /* ------------------------------------------------------------------ *
   * Scene
   * ------------------------------------------------------------------ */
  const camera = new PerspectiveCamera(45, 1, 1, 20000);

  const cubeLayer = createCubeLayer(
    new Map(FACES.map((face, i) => [face.id, sections[i]])),
  );
  css3dLayer.append(cubeLayer.renderer.domElement);

  const layout = createLayout({ stage, camera, cubeLayer, root });

  /**
   * The WebGL contact shadow arrives separately. It pulls in three's
   * WebGLRenderer — about 400kB of the bundle — to draw one soft blob, so
   * making the cube wait for it would be a poor trade. It fades in when it
   * lands, and its absence changes nothing else.
   */
  let shadowLayer = null;

  function loadShadowLayer() {
    return import('./cube/scene.js')
      .then(({ createShadowLayer }) => {
        const created = createShadowLayer();
        if (!created) return;
        shadowLayer = created;
        glLayer.append(shadowLayer.renderer.domElement);
        shadowLayer.setSize(stage.clientWidth, stage.clientHeight);
        invalidate();
      })
      .catch(() => {
        // No WebGL, or the chunk failed to load. The cube is fine without it.
      });
  }

  /* ------------------------------------------------------------------ *
   * UI
   * ------------------------------------------------------------------ */
  const a11y = createFaceA11y(sections, liveRegion);

  const panel = createPanel({
    panel: document.getElementById('panel'),
    backdrop: document.getElementById('panel-backdrop'),
    titleElement: document.getElementById('panel-title'),
    bodyElement: document.getElementById('panel-body'),
    closeButton: document.getElementById('panel-close'),
    reducedMotion,
  });

  const background = [
    document.querySelector('.site-header'),
    stage,
    document.getElementById('roll'),
    navElement,
  ];

  panel.onOpen = () => {
    controls.setEnabled(false);
    background.forEach((el) => {
      el.inert = true;
    });
  };

  panel.onClose = () => {
    background.forEach((el) => {
      el.inert = false;
    });
    controls.setEnabled(true);
    invalidate();
  };

  function openDetailFor(section) {
    const detail = section.querySelector('.face__detail');
    if (!detail) return;
    panel.open(
      detail,
      detail.dataset.detailTitle ?? section.dataset.label ?? '',
      document.activeElement,
    );
  }

  sections.forEach((section) => {
    section.querySelector('.face__more')?.addEventListener('click', () => {
      openDetailFor(section);
    });
  });

  const nav = createNav(navElement, labels(), (index) => controls.goToFace(index));

  /* ------------------------------------------------------------------ *
   * Controls
   * ------------------------------------------------------------------ */
  const controls = createControls({
    stage,
    reducedMotion,
    onFaceChange(index) {
      nav.setActive(index);
      if (mode === 'cube') a11y.setActive(index);
      controls.setStill(sections[index]?.dataset.face === 'contact');
    },
    onTap(target) {
      // A tap on the face you are already looking at opens its detail.
      const section = target instanceof Element ? target.closest('.face') : null;
      if (section && section === sections[controls.activeFace]) {
        openDetailFor(section);
      }
    },
  });

  /* ------------------------------------------------------------------ *
   * Render loop — only draws when something actually moved.
   * ------------------------------------------------------------------ */
  let needsRender = true;
  let frameId = 0;

  function invalidate() {
    needsRender = true;
    controls.invalidate();
  }

  layout.onChange = () => {
    shadowLayer?.setSize(stage.clientWidth, stage.clientHeight);
    invalidate();
  };

  function frame(now) {
    frameId = requestAnimationFrame(frame);

    const moved = controls.update(now);
    if (!moved && !needsRender) return;
    needsRender = false;

    cubeLayer.group.quaternion.copy(controls.presented);
    cubeLayer.renderer.render(cubeLayer.scene, camera);

    if (shadowLayer) {
      shadowLayer.update(controls.presented, layout.faceSize);
      shadowLayer.render(camera);
    }
  }

  function startLoop() {
    if (frameId) return;
    invalidate();
    frameId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (mode === 'cube') startLoop();
  });

  /* ------------------------------------------------------------------ *
   * Cube mode ⇄ list mode
   * ------------------------------------------------------------------ */
  let mode = 'cube';

  function setMode(next) {
    if (next === mode) return;
    mode = next;
    // Sections are about to be re-parented, so the detail node has to be
    // back where it belongs before anything moves.
    panel.close({ immediate: true });

    if (mode === 'list') {
      stopLoop();
      root.classList.remove('cube-mode', 'cube-ready');
      root.classList.add('list-mode');
      // Take the sections back from the CSS3D container, in source order.
      facesHome.append(...sections);
      a11y.reset();
      navElement.hidden = true;
      viewToggle.setAttribute('aria-pressed', 'true');
      viewToggle.textContent = i18n.t('view.cube');
    } else {
      root.classList.remove('list-mode');
      root.classList.add('cube-mode');
      navElement.hidden = false;
      viewToggle.setAttribute('aria-pressed', 'false');
      viewToggle.textContent = i18n.t('view.list');
      // The CSS3D renderer re-adopts the elements on its next draw.
      layout.apply();
      a11y.setActive(controls.activeFace);
      startLoop();
      requestAnimationFrame(() => root.classList.add('cube-ready'));
    }
  }

  let lastRoll = null;

  function paintRoll() {
    if (!lastRoll) return;
    if (lastRoll.error) {
      rollResult.textContent = i18n.t('roll.fail');
      return;
    }
    const { value, remainder, die, index } = lastRoll;
    rollResult.textContent = `${value} mod 6 = ${remainder} → ${die} · ${faceLabel(index)}`;
  }

  function refreshLanguage() {
    nav.setLabels(labels());
    viewToggle.textContent = mode === 'list' ? i18n.t('view.cube') : i18n.t('view.list');
    const openDetail = document.querySelector('#panel-body .face__detail');
    if (openDetail) {
      document.getElementById('panel-title').textContent =
        openDetail.dataset.detailTitle ?? '';
    }
    liveRegion.textContent = faceLabel(controls.activeFace);
    paintRoll();
    invalidate();
  }

  document.querySelectorAll('.lang__option').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.lang === 'en' ? 'en' : 'tr';
      i18n.apply(next);
      rememberLang(next);
      refreshLanguage();
    });
  });

  viewToggle.addEventListener('click', () => {
    setMode(mode === 'cube' ? 'list' : 'cube');
  });

  /* ------------------------------------------------------------------ *
   * True random — RANDOM.ORG integer, then mod 6 picks the die face.
   * ------------------------------------------------------------------ */
  const RANDOM_URL =
    'https://www.random.org/integers/?num=1&min=1&max=1000000000&col=1&base=10&format=plain&rnd=new';

  const roll = document.getElementById('roll');
  const rollButton = document.getElementById('roll-button');
  const rollHelp = document.getElementById('roll-help');
  const rollNote = document.getElementById('roll-note');
  const rollResult = document.getElementById('roll-result');

  rollHelp.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = rollHelp.getAttribute('aria-expanded') === 'true';
    rollHelp.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  document.addEventListener('click', (event) => {
    if (rollHelp.contains(event.target) || rollNote.contains(event.target)) return;
    rollHelp.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') rollHelp.setAttribute('aria-expanded', 'false');
  });

  rollButton.addEventListener('click', async () => {
    if (rollButton.disabled) return;
    rollButton.disabled = true;
    rollResult.textContent = '…';

    try {
      const response = await fetch(RANDOM_URL);
      const body = (await response.text()).trim();
      if (!response.ok) throw new Error(body || 'HTTP');
      const value = Number(body);
      if (!Number.isInteger(value)) throw new Error(body || 'yanıt');

      const remainder = value % 6;
      const die = remainder === 0 ? 6 : remainder;
      const index = die - 1;
      lastRoll = { value, remainder, die, index };
      paintRoll();

      if (mode === 'list') setMode('cube');
      else panel.close({ immediate: true });
      controls.goToFace(index);
    } catch {
      lastRoll = { error: true };
      paintRoll();
    } finally {
      rollButton.disabled = false;
    }
  });

  /* ------------------------------------------------------------------ *
   * Go
   * ------------------------------------------------------------------ */
  root.classList.add('cube-mode');
  layout.apply();

  navElement.hidden = false;
  viewToggle.hidden = false;
  viewToggle.textContent = i18n.t('view.list');
  roll.hidden = false;

  a11y.setActive(0);
  nav.setActive(0);
  startLoop();

  requestAnimationFrame(() => {
    root.classList.add('cube-ready');
    controls.playIntro();
    loadShadowLayer();
  });

  if (import.meta.env.DEV) {
    window.__cube = {
      controls,
      layout,
      panel,
      setMode,
      get mode() {
        return mode;
      },
    };
  }
}

try {
  window.clearTimeout(window.__cubeBootTimer);
  boot();
} catch (error) {
  // Fall back to the plain document rather than leaving a blank page.
  root.classList.remove('js', 'cube-mode');
  console.error('[cube] falling back to the document view:', error);
}
