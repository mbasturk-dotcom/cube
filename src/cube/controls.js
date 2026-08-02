import { Quaternion, Vector3 } from 'three';
import { activeFaceIndex, orientationForFace, restingOrientation } from './orientation.js';

const HALF_PI = Math.PI / 2;

const DRAG_SENSITIVITY = 0.0062; // radians per pixel
const INERTIA_DECAY = 0.92; // per 16ms
const INERTIA_FLOOR = 0.12; // px/frame at which we stop coasting and settle
const INERTIA_CEILING = 42; // px/frame — one wild sample must not launch the cube
const INERTIA_MAX_MS = 900; // hard stop, so a starved frame budget cannot strand it
const SNAP_MS = 420;
const SNAP_MS_REDUCED = 120;
const INTRO_MS = 950;
const TAP_SLOP = 6; // px of movement still counted as a tap
const TAP_MS = 500;
const IDLE_DELAY = 5000;

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Free-drag rotation with a snap back to an aligned orientation, plus
 * keyboard stepping and a barely-there idle drift.
 *
 * Two quaternions are kept: `orientation` is where the cube logically is
 * (what the snap and the active-face readout use), and `presented` is that
 * plus the idle drift. Keeping the drift out of the logical orientation
 * means it can never nudge the cube into settling on the wrong face.
 */
export function createControls({ stage, reducedMotion, onTap, onFaceChange }) {
  const orientation = new Quaternion();
  const presented = new Quaternion();

  const snapFrom = new Quaternion();
  const snapTo = new Quaternion();
  const scratch = new Quaternion();
  const step = new Quaternion();
  const drift = new Quaternion();
  const driftX = new Quaternion();

  let mode = 'rest'; // rest | drag | inertia | snap
  let enabled = true;
  let dirty = true;

  let pointerId = null;
  let pressTarget = null;
  let lastX = 0;
  let lastY = 0;
  let travelled = 0;
  let pressedAt = 0;

  let velX = 0;
  let velY = 0;
  let inertiaStart = 0;

  let snapStart = 0;
  let snapDuration = SNAP_MS;

  let lastInput = performance.now();
  let driftAmount = 0;
  let lastFrame = performance.now();
  let faceIndex = 0;

  const snapMs = () => (reducedMotion() ? SNAP_MS_REDUCED : SNAP_MS);

  /* ---------------------------------------------------------------- *
   * Rotation helpers
   * ---------------------------------------------------------------- */
  function rotateBy(dx, dy) {
    step.setFromAxisAngle(Y_AXIS, dx * DRAG_SENSITIVITY);
    orientation.premultiply(step);
    step.setFromAxisAngle(X_AXIS, dy * DRAG_SENSITIVITY);
    orientation.premultiply(step);
    orientation.normalize();
  }

  function snapToQuaternion(target, duration = snapMs()) {
    snapFrom.copy(orientation);
    snapTo.copy(target);
    snapStart = performance.now();
    snapDuration = Math.max(1, duration);
    mode = 'snap';
    dirty = true;
  }

  function settle() {
    snapToQuaternion(restingOrientation(orientation, scratch));
  }

  /**
   * Turn a quarter of the way around the camera's axis and land on whatever
   * face that reveals — upright. Stepping "up" from a side face genuinely
   * does arrive at a rolled top face, so the destination is re-derived from
   * the face rather than from the raw rotation.
   */
  function stepAround(axis, angle) {
    orientationForFace(activeFaceIndex(orientation), scratch);
    step.setFromAxisAngle(axis, angle);
    scratch.premultiply(step);
    snapToQuaternion(restingOrientation(scratch, scratch));
    lastInput = performance.now();
  }

  function goToFace(index) {
    snapToQuaternion(orientationForFace(index, scratch));
    lastInput = performance.now();
  }

  function playIntro() {
    if (reducedMotion()) {
      orientation.identity();
      dirty = true;
      return;
    }
    orientation.setFromAxisAngle(Y_AXIS, -0.62);
    step.setFromAxisAngle(X_AXIS, 0.34);
    orientation.premultiply(step);
    snapToQuaternion(orientationForFace(0, scratch), INTRO_MS);
  }

  /* ---------------------------------------------------------------- *
   * Pointer input
   * ---------------------------------------------------------------- */
  function onPointerDown(event) {
    if (!enabled || pointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Let real controls behave like real controls.
    if (event.target.closest('a, button')) return;

    pointerId = event.pointerId;
    // Pointer capture retargets every later event to the stage, so the only
    // chance to learn which face is under the finger is right now.
    pressTarget = event.target;
    try {
      // Capture keeps the drag alive outside the stage. It throws if the
      // pointer has already gone away, which is survivable — the drag just
      // ends at the edge instead of following the cursor out.
      stage.setPointerCapture(pointerId);
    } catch {
      /* no capture available */
    }
    stage.dataset.dragging = 'true';

    lastX = event.clientX;
    lastY = event.clientY;
    travelled = 0;
    pressedAt = performance.now();
    velX = 0;
    velY = 0;
    mode = 'drag';
    lastInput = pressedAt;
    dirty = true;
  }

  function onPointerMove(event) {
    if (pointerId !== event.pointerId) return;

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    travelled += Math.hypot(dx, dy);

    rotateBy(dx, dy);

    // Smoothed so a single jittery sample cannot fling the cube.
    velX = velX * 0.6 + dx * 0.4;
    velY = velY * 0.6 + dy * 0.4;

    lastInput = performance.now();
    dirty = true;
  }

  function releasePointer() {
    if (pointerId === null) return;
    if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
    pointerId = null;
    pressTarget = null;
    delete stage.dataset.dragging;
  }

  function onPointerUp(event) {
    if (pointerId !== event.pointerId) return;

    const wasTap =
      travelled < TAP_SLOP && performance.now() - pressedAt < TAP_MS;
    const target = pressTarget;
    releasePointer();

    if (wasTap) {
      settle();
      onTap?.(target);
      return;
    }

    const speed = Math.hypot(velX, velY);
    if (reducedMotion() || speed < INERTIA_FLOOR) {
      settle();
    } else {
      if (speed > INERTIA_CEILING) {
        const scale = INERTIA_CEILING / speed;
        velX *= scale;
        velY *= scale;
      }
      inertiaStart = performance.now();
      mode = 'inertia';
      dirty = true;
    }
  }

  function onPointerCancel(event) {
    if (pointerId !== event.pointerId) return;
    releasePointer();
    settle();
  }

  /* ---------------------------------------------------------------- *
   * Keyboard input
   * ---------------------------------------------------------------- */
  function onKeyDown(event) {
    if (!enabled) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target;
    if (target instanceof HTMLElement) {
      if (target.closest('input, textarea, select, [contenteditable], [role="dialog"]')) {
        return;
      }
    }

    switch (event.key) {
      case 'ArrowRight':
        stepAround(Y_AXIS, -HALF_PI);
        break;
      case 'ArrowLeft':
        stepAround(Y_AXIS, HALF_PI);
        break;
      case 'ArrowUp':
        stepAround(X_AXIS, HALF_PI);
        break;
      case 'ArrowDown':
        stepAround(X_AXIS, -HALF_PI);
        break;
      case 'Home':
        goToFace(0);
        break;
      default: {
        const digit = Number.parseInt(event.key, 10);
        if (digit >= 1 && digit <= 6) {
          goToFace(digit - 1);
          break;
        }
        return;
      }
    }

    event.preventDefault();
  }

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('keydown', onKeyDown);

  /* ---------------------------------------------------------------- *
   * Frame update
   * ---------------------------------------------------------------- */
  function update(now) {
    const dt = Math.min(64, now - lastFrame);
    lastFrame = now;
    const frames = dt / 16.6667;

    let changed = dirty;
    dirty = false;

    if (mode === 'inertia') {
      rotateBy(velX * frames, velY * frames);
      const decay = INERTIA_DECAY ** frames;
      velX *= decay;
      velY *= decay;
      changed = true;
      if (
        Math.hypot(velX, velY) < INERTIA_FLOOR ||
        now - inertiaStart > INERTIA_MAX_MS
      ) {
        settle();
      }
    } else if (mode === 'snap') {
      const t = Math.min(1, (now - snapStart) / snapDuration);
      orientation.slerpQuaternions(snapFrom, snapTo, easeOutCubic(t));
      changed = true;
      if (t === 1) {
        orientation.copy(snapTo);
        mode = 'rest';
      }
    }

    // Idle drift: a slow, small wobble that keeps the cube feeling alive
    // without ever making the front face hard to read.
    const wantsDrift =
      enabled && mode === 'rest' && !reducedMotion() && now - lastInput > IDLE_DELAY;
    const targetAmount = wantsDrift ? 1 : 0;
    if (driftAmount !== targetAmount) {
      const rate = Math.min(1, dt / 700);
      driftAmount += (targetAmount - driftAmount) * rate;
      if (Math.abs(driftAmount - targetAmount) < 0.002) driftAmount = targetAmount;
      changed = true;
    }

    if (driftAmount > 0) {
      drift.setFromAxisAngle(Y_AXIS, Math.sin(now * 0.00052) * 0.05 * driftAmount);
      driftX.setFromAxisAngle(X_AXIS, Math.sin(now * 0.00037 + 1) * 0.032 * driftAmount);
      presented.copy(drift).multiply(driftX).multiply(orientation);
      changed = true;
    } else {
      presented.copy(orientation);
    }

    if (changed) {
      const next = activeFaceIndex(orientation);
      if (next !== faceIndex) {
        faceIndex = next;
        onFaceChange?.(next);
      }
    }

    return changed;
  }

  return {
    orientation,
    presented,
    update,
    goToFace,
    playIntro,
    get activeFace() {
      return faceIndex;
    },
    get isDragging() {
      return mode === 'drag';
    },
    setEnabled(value) {
      enabled = value;
      if (!enabled) {
        releasePointer();
        if (mode === 'drag' || mode === 'inertia') settle();
      } else {
        lastInput = performance.now();
      }
      dirty = true;
    },
    invalidate() {
      dirty = true;
    },
    destroy() {
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
