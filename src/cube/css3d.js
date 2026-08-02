import { Group, Scene } from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { FACES } from './orientation.js';

/**
 * Wraps the six <section> elements that were authored in index.html as
 * CSS3DObjects and arranges them into a cube.
 *
 * The elements are *moved*, not cloned — there is exactly one copy of the
 * content in the DOM, so text stays selectable, links stay real and search
 * engines see the same markup either way.
 */
export function createCubeLayer(sectionsById) {
  const renderer = new CSS3DRenderer();
  const scene = new Scene();
  const group = new Group();
  scene.add(group);

  const objects = FACES.map((face) => {
    const element = sectionsById.get(face.id);
    if (!element) throw new Error(`Missing section markup for face "${face.id}"`);

    const object = new CSS3DObject(element);
    object.rotation.copy(face.mount);
    group.add(object);
    return object;
  });

  /** Push the faces out to the corners of a cube `size` pixels across. */
  function setFaceSize(size) {
    const half = size / 2;
    objects.forEach((object, i) => {
      object.position.copy(FACES[i].normal).multiplyScalar(half);
    });
  }

  function setSize(width, height) {
    renderer.setSize(width, height);
  }

  return { renderer, scene, group, objects, setFaceSize, setSize };
}
