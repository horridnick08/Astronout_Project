import * as THREE from 'three';

export const PACK_PATH = '/models/astronaut/space_sci_fi_pack.glb';

/**
 * Normalizes an extracted GLTF node into a standalone, centered, scaled wrapper group.
 * - Anchors base flat at local y = 0 (or centered for spheres)
 * - X and Z centered at 0
 * - Scales to targetHeight
 * - Enforces static shadows and matrices
 */
export function createStaticNormalizedProp(sourceNode, targetHeight, centerVertically = false) {
  if (!sourceNode) return null;

  const clone = sourceNode.clone(true);
  clone.position.set(0, 0, 0);

  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const wrapper = new THREE.Group();
  const currentHeight = size.y || 1;
  const scale = targetHeight ? (targetHeight / currentHeight) : 1;

  clone.position.x = -center.x;
  clone.position.y = centerVertically ? -center.y : -box.min.y;
  clone.position.z = -center.z;

  wrapper.add(clone);
  wrapper.scale.setScalar(scale);

  wrapper.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.isStatic = true;
      child.matrixAutoUpdate = false;
      if (child.material) {
        child.material = child.material.clone();
        child.material.needsUpdate = true;
      }
      child.updateMatrix();
    }
  });

  wrapper.userData.isStatic = true;
  wrapper.matrixAutoUpdate = false;
  wrapper.updateMatrix();

  return wrapper;
}
