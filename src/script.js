import * as THREE from 'three';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * ------------
 * PRESETS
 * ------------ */
// Canvas
const canvas = document.getElementById('canvas');

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = sizes.width / sizes.height;

// Animation
const clock = new THREE.Clock();
let previousTime = 0;
let mixer = null;
const actions = [];

// GUI
const gui = new GUI();
const parameters = {};

/**
 * ------------
 * SCENE
 * ------------ */
const scene = new THREE.Scene();

/**
 * ------------
 * OBJECTS
 * ------------ */
/** Models */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // this is worker in our static folder

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  console.log(gltf);

  gltf.scene.scale.set(0.025, 0.025, 0.025);
  scene.add(gltf.scene);

  mixer = new THREE.AnimationMixer(gltf.scene);

  // save the animations to variables
  gltf.animations.forEach((clip) => {
    const action = mixer.clipAction(clip);
    actions.push({ name: clip.name, action, running: false });
  });

  const toggleAction = (selectedAction) => {
    actions.forEach(({ action, running }) => {
      if (action === selectedAction) {
        running ? action.stop() : action.play();
        actions.forEach(
          ({ action: otherAction }) =>
            otherAction !== action && otherAction.stop()
        );
        running = !running;
      } else {
        action.stop();
        running = false;
      }
    });
  };

  // toggle shadow for the fox
  gltf.scene.children[0].castShadow = true;

  const stopAllActions = () => {
    actions.forEach(({ action }) => action.stop());
    actions.forEach((action) => (action.running = false));
  };

  // folder for the fox in the gui
  const foxGui = gui.addFolder('Fox');
  foxGui.open();

  // add the actions to the gui and add a button to stop all actions
  actions.forEach(({ name, action }) => {
    foxGui.add({ [`${name}`]: () => toggleAction(action) }, `${name}`);
  });
  foxGui.add({ Stop: stopAllActions }, 'Stop');

  actions[0].action.play();
});

/** Floor */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: '#444444',
    metalness: 0,
    roughness: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * ------------
 * LIGHTS
 * ------------ */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * ------------
 * CAMERA
 * ------------ */
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2, 2, 2);
scene.add(camera);

/**
 * ------------
 * RENDER
 * ------------ */
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * ------------
 * UTILS
 * ------------ */
// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  aspectRatio = sizes.width / sizes.height;

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;

/**
 * ------------
 * ANIMATION
 * ------------ */
/**
 * ------------
 * START
 * ------------ */

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (mixer) {
    mixer.update(deltaTime);
  }

  controls.update();

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
