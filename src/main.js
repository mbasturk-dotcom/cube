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
  const labels = sections.map((section) => section.dataset.label ?? '');

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

  const background = [document.querySelector('.site-header'), stage, navElement];

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

  const nav = createNav(navElement, labels, (index) => controls.goToFace(index));

  /* ------------------------------------------------------------------ *
   * Controls
   * ------------------------------------------------------------------ */
  const controls = createControls({
    stage,
    reducedMotion,
    onFaceChange(index) {
      nav.setActive(index);
      if (mode === 'cube') a11y.setActive(index);
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
      viewToggle.textContent = 'View as cube';
    } else {
      root.classList.remove('list-mode');
      root.classList.add('cube-mode');
      navElement.hidden = false;
      viewToggle.setAttribute('aria-pressed', 'false');
      viewToggle.textContent = 'View as list';
      // The CSS3D renderer re-adopts the elements on its next draw.
      layout.apply();
      a11y.setActive(controls.activeFace);
      startLoop();
      requestAnimationFrame(() => root.classList.add('cube-ready'));
    }
  }

  viewToggle.addEventListener('click', () => {
    setMode(mode === 'cube' ? 'list' : 'cube');
  });

  /* ------------------------------------------------------------------ *
   * Go
   * ------------------------------------------------------------------ */
  root.classList.add('cube-mode');
  layout.apply();

  navElement.hidden = false;
  viewToggle.hidden = false;

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
