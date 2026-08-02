const MIN_FACE = 170;
const MAX_FACE = 440;

/** Width the stage may give up to the cube at its widest. */
const WIDTH_MARGIN = 0.98;
/** Height gets a little more slack so the contact shadow has room. */
const HEIGHT_MARGIN = 0.96;

/**
 * Half-diagonal of a face, as a multiple of the face size. Turned 45° about
 * its vertical axis — what a horizontal drag produces — a cube is this much
 * wider than it is at rest, and its nearest corner is this much closer to
 * the camera.
 */
const CORNER = Math.SQRT1_2;

/**
 * Largest face size whose corner-on silhouette still fits inside `limit`.
 *
 * Perspective matters here: the near corner sits `CORNER * size` in front of
 * the cube's centre and is magnified by `D / (D - CORNER * size)`. Solving
 * `2 * CORNER * size * D / (D - CORNER * size) <= limit` for size gives:
 */
function fit(limit, distance) {
  return (limit * distance) / (CORNER * (2 * distance + limit));
}

/**
 * Sizing rule for the whole scene.
 *
 * The CSS3D renderer works in CSS pixels, so putting the camera exactly one
 * projection height away makes one world unit equal one screen pixel at the
 * cube's centre. A face element that is 320px wide then renders at roughly
 * that size — which means the type inside it can be sized with ordinary
 * container queries rather than being scaled by the projection.
 */
export function createLayout({ stage, camera, cubeLayer, root }) {
  let faceSize = 0;
  let onChange = null;

  function apply() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width === 0 || height === 0) return false;

    const fovRad = (camera.fov * Math.PI) / 180;
    const distance = (0.5 * height) / Math.tan(fovRad / 2);

    faceSize = Math.round(
      Math.max(
        MIN_FACE,
        Math.min(
          fit(width * WIDTH_MARGIN, distance),
          fit(height * HEIGHT_MARGIN, distance),
          MAX_FACE,
        ),
      ),
    );

    root.style.setProperty('--face-size', `${faceSize}px`);

    camera.position.set(0, 0, distance);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    cubeLayer.setFaceSize(faceSize);
    cubeLayer.setSize(width, height);

    return true;
  }

  const observer = new ResizeObserver(() => {
    if (apply()) onChange?.();
  });
  observer.observe(stage);

  return {
    apply,
    get faceSize() {
      return faceSize;
    },
    set onChange(fn) {
      onChange = fn;
    },
    destroy() {
      observer.disconnect();
    },
  };
}
