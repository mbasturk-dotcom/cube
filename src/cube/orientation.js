import { Euler, Quaternion, Vector3 } from 'three';

const HALF_PI = Math.PI / 2;

/**
 * The six faces, in navigation order.
 *
 * `normal` is the face's outward direction in the cube's local space.
 * `mount`  is the rotation that turns a default (+Z facing) plane into
 *          that face — it is what we apply to the CSS3DObject.
 *
 * The four "ring" faces come first so that a horizontal turn walks
 * through About → Experience → Projects → Skills.
 */
const FACE_TABLE = [
  { id: 'about', normal: new Vector3(0, 0, 1), mount: new Euler(0, 0, 0) },
  { id: 'experience', normal: new Vector3(1, 0, 0), mount: new Euler(0, HALF_PI, 0) },
  { id: 'projects', normal: new Vector3(0, 0, -1), mount: new Euler(0, Math.PI, 0) },
  { id: 'skills', normal: new Vector3(-1, 0, 0), mount: new Euler(0, -HALF_PI, 0) },
  { id: 'education', normal: new Vector3(0, 1, 0), mount: new Euler(-HALF_PI, 0, 0) },
  { id: 'contact', normal: new Vector3(0, -1, 0), mount: new Euler(HALF_PI, 0, 0) },
];

/**
 * `upright` is the one orientation where this face is square to the camera
 * *and* its text runs the right way up. These six are the only poses the
 * cube ever comes to rest in.
 *
 * A cube technically has 24 aligned orientations, but the other 18 leave the
 * content rolled on its side or upside down — fine for a puzzle, useless for
 * a CV. Tumbling is free; resting is not.
 */
export const FACES = FACE_TABLE.map((face) => ({
  ...face,
  upright: new Quaternion().setFromEuler(face.mount).invert(),
}));

export const FACE_COUNT = FACES.length;

const _v = new Vector3();

/** Index of the face currently pointing closest to the camera (+Z). */
export function activeFaceIndex(q) {
  let best = 0;
  let bestZ = -Infinity;

  for (let i = 0; i < FACES.length; i += 1) {
    _v.copy(FACES[i].normal).applyQuaternion(q);
    if (_v.z > bestZ) {
      bestZ = _v.z;
      best = i;
    }
  }

  return best;
}

/** The upright pose of a given face. */
export function orientationForFace(index, target = new Quaternion()) {
  return target.copy(FACES[index].upright);
}

/** The upright pose of whichever face `q` is closest to showing. */
export function restingOrientation(q, target = new Quaternion()) {
  return orientationForFace(activeFaceIndex(q), target);
}
