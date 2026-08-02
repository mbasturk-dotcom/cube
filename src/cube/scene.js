import {
  CanvasTexture,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

/**
 * A soft contact shadow, drawn in WebGL underneath the cube.
 *
 * CSS3D and WebGL composite as separate layers with no shared depth
 * buffer, so nothing here may ever need to occlude a face. Keeping this
 * layer to a single camera-facing blob avoids that problem entirely while
 * still giving the cube something to sit on against a flat background.
 */
function createShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, 'rgba(23, 23, 26, 0.30)');
  gradient.addColorStop(0.4, 'rgba(23, 23, 26, 0.15)');
  gradient.addColorStop(0.72, 'rgba(23, 23, 26, 0.04)');
  gradient.addColorStop(1, 'rgba(23, 23, 26, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createShadowLayer() {
  let renderer;

  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return null; // No WebGL — the CSS3D cube works perfectly well alone.
  }

  renderer.setClearAlpha(0);

  const scene = new Scene();
  const material = new MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  const mesh = new Mesh(new PlaneGeometry(1, 1), material);
  scene.add(mesh);

  const rotation = new Matrix4();

  function setSize(width, height) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  /**
   * Resize the blob to the cube's footprint so it widens as a corner
   * swings towards the viewer and tightens when a face squares up.
   */
  function update(quaternion, cubeSize) {
    rotation.makeRotationFromQuaternion(quaternion);
    const e = rotation.elements;
    const half = cubeSize / 2;

    const spreadX = half * (Math.abs(e[0]) + Math.abs(e[4]) + Math.abs(e[8]));
    const spreadY = half * (Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9]));

    mesh.scale.set(spreadX * 2.3, cubeSize * 0.34, 1);
    mesh.position.set(0, -spreadY - cubeSize * 0.1, -half);

    // A wider footprint means a more diffuse shadow.
    material.opacity = Math.min(1, (half / spreadX) * 1.05);
  }

  function render(camera) {
    renderer.render(scene, camera);
  }

  function dispose() {
    material.map.dispose();
    material.dispose();
    mesh.geometry.dispose();
    renderer.dispose();
  }

  return { renderer, setSize, update, render, dispose };
}
