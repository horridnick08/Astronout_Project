import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { discoverBones } from './src/engine/MocapEngine.js';

if (typeof self === 'undefined') global.self = global;
if (typeof window === 'undefined') global.window = global;

const loader = new GLTFLoader();
const glbBuffer = fs.readFileSync('public/models/astronaut/space_sci_fi_pack.glb');
const arrayBuffer = glbBuffer.buffer.slice(glbBuffer.byteOffset, glbBuffer.byteOffset + glbBuffer.byteLength);

loader.parse(arrayBuffer, '', (gltf) => {
  const cloned = skeletonClone(gltf.scene);
  const bones = discoverBones(cloned);

  const leftArm = bones.leftUpperArm;
  const rightArm = bones.rightUpperArm;
  const leftHand = bones.leftHand;
  const rightHand = bones.rightHand;

  console.log('Rest:');
  console.log('  leftArm rot:', leftArm.rotation.toArray());
  console.log('  rightArm rot:', rightArm.rotation.toArray());
  console.log('  leftHand rot:', leftHand.rotation.toArray());
  console.log('  rightHand rot:', rightHand.rotation.toArray());
});
