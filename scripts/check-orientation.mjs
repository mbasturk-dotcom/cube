import { Quaternion, Vector3 } from 'three';
import {
  FACES,
  activeFaceIndex,
  orientationForFace,
  restingOrientation,
} from '../src/cube/orientation.js';

let failures = 0;
const check = (name, ok, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);
const rng = (() => {
  let seed = 12345;
  return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
})();
const randomQuaternion = () =>
  new Quaternion(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();

/**
 * "Upright" means: the face is square to the camera, and the face's own up
 * and right axes still point up and right on screen. Anything else leaves
 * the text rolled.
 */
function isUpright(q, faceIndex) {
  const face = FACES[faceIndex];
  const normal = face.normal.clone().applyQuaternion(q);
  if (normal.z < 0.999) return false;

  // The face's local up, once mounted onto the cube and rotated by q.
  const faceUp = UP.clone().applyEuler(face.mount).applyQuaternion(q);
  const faceRight = RIGHT.clone().applyEuler(face.mount).applyQuaternion(q);
  return faceUp.y > 0.999 && faceRight.x > 0.999;
}

// 1. Each face's resting pose shows that face, the right way up.
FACES.forEach((face, i) => {
  check(`${face.id} rests facing the camera`, activeFaceIndex(face.upright) === i);
  check(`${face.id} rests upright`, isUpright(face.upright, i));
});

// 2. Faces sit opposite each other as expected.
[
  ['about', 'impact'],
  ['experience', 'skills'],
  ['education', 'contact'],
].forEach(([a, b]) => {
  const na = FACES.find((f) => f.id === a).normal;
  const nb = FACES.find((f) => f.id === b).normal;
  check(`${a} is opposite ${b}`, Math.abs(na.dot(nb) + 1) < 1e-6);
});

// 3. From *any* tumbled orientation, settling lands upright on the face the
//    user was already looking at — never on a neighbour, never on its side.
let notUpright = 0;
let changedFace = 0;
let worstTravel = 0;

for (let i = 0; i < 5000; i += 1) {
  const q = randomQuaternion();
  const wanted = activeFaceIndex(q);
  const rest = restingOrientation(q);

  if (activeFaceIndex(rest) !== wanted) changedFace += 1;
  if (!isUpright(rest, wanted)) notUpright += 1;

  const angle = 2 * Math.acos(Math.min(1, Math.abs(q.dot(rest))));
  worstTravel = Math.max(worstTravel, angle);
}

check('settling never switches to a different face', changedFace === 0, `${changedFace} switches`);
check('settling always lands upright', notUpright === 0, `${notUpright} rolled`);
check(
  'settling never has to unwind more than 180°',
  worstTravel <= Math.PI + 1e-6,
  `worst=${((worstTravel * 180) / Math.PI).toFixed(1)}°`,
);

// 4. Jumping straight to a section from anywhere also lands upright.
let jumpWrong = 0;
for (let i = 0; i < 2000; i += 1) {
  randomQuaternion(); // keep the sequence moving
  const target = (FACES.length * rng()) | 0;
  const q = orientationForFace(target);
  if (activeFaceIndex(q) !== target || !isUpright(q, target)) jumpWrong += 1;
}
check('orientationForFace always lands upright on the requested face', jumpWrong === 0);

// 5. A quarter turn walks the ring in navigation order, staying upright.
const Y = new Vector3(0, 1, 0);
const walked = [];
let q = new Quaternion();
for (let i = 0; i < 5; i += 1) {
  const index = activeFaceIndex(q);
  walked.push(FACES[index].id);
  if (!isUpright(q, index)) failures += 1;

  const stepped = orientationForFace(index).premultiply(
    new Quaternion().setFromAxisAngle(Y, -Math.PI / 2),
  );
  q = restingOrientation(stepped);
}
check(
  'a quarter turn walks About → Experience → Impact → Skills → About',
  walked.join(',') === 'about,experience,impact,skills,about',
  walked.join(' → '),
);

// 6. Stepping "up" from a side face lands on Education, upright — the case
//    where the raw rotation would otherwise leave the top face rolled.
const fromExperience = orientationForFace(1);
const steppedUp = fromExperience
  .clone()
  .premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));
const landed = restingOrientation(steppedUp);
check(
  'stepping up from Experience lands on Education, upright',
  FACES[activeFaceIndex(landed)].id === 'education' && isUpright(landed, activeFaceIndex(landed)),
  FACES[activeFaceIndex(landed)].id,
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
