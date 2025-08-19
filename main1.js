import * as THREE from 'three';
import * as dat from 'lil-gui';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace; // keep as-is for your environment
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// clock & animation mixer
const clock = new THREE.Clock();
let mixer = null; // AnimationMixer for GLTF animations

// Texture loader
const textureLoader = new THREE.TextureLoader();
const SampleTexture = textureLoader.load('/static/textures/sample3.jpg');
SampleTexture.colorSpace = THREE.SRGBColorSpace;
SampleTexture.magFilter = THREE.NearestFilter;

// Geometries
const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
const geometry1 = new THREE.ConeGeometry(1, 2, 32);
const geometry2 = new THREE.TorusGeometry(1, 0.4, 16, 100);
const geometry3 = new THREE.SphereGeometry(1, 32, 32);

// Materials
const material = new THREE.MeshStandardMaterial({ color: '#00bfff', metalness: 0.5, roughness: 0.5 });
const material1 = new THREE.MeshStandardMaterial({ color: '#ff6347', metalness: 0.5, roughness: 0.5 });
const material2 = new THREE.MeshStandardMaterial({ color: '#32cd32', metalness: 0.5, roughness: 0.5 });
const material3 = new THREE.MeshStandardMaterial({ map: SampleTexture, metalness: 0.5, roughness: 0.5 });

// Meshes
const cube = new THREE.Mesh(geometry, material);
const cube1 = new THREE.Mesh(geometry1, material1);
const cube2 = new THREE.Mesh(geometry2, material2);
const cube3 = new THREE.Mesh(geometry3, material3);

// Positioning
cube.position.x = -2.5;
cube1.position.x = 0;
cube2.position.x = 2.5;
cube3.position.y = -3;

// Add to scene
scene.add(cube, cube1, cube2, cube3);

// Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// HDR Background & Environment (keep your path)
new RGBELoader()
    .setPath('/static/environmentMaps/')
    .load('zwartkops_straight_afternoon_1k.hdr', (hdrEquirect) => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = hdrEquirect;
        scene.environment = hdrEquirect;
    });

// GUI Setup
const gui = new dat.GUI();

// Torus (Blue)
const torusFolder = gui.addFolder('Torus (Blue)');
torusFolder.add(cube.position, 'y').min(-5).max(3).step(0.1);
torusFolder.addColor(material, 'color');
torusFolder.add(cube, 'visible');
torusFolder.add(material, 'wireframe');
torusFolder.add(material, 'metalness').min(0).max(1).step(0.01);
torusFolder.add(material, 'roughness').min(0).max(1).step(0.01);
torusFolder.open();

// Cone (Red)
const coneFolder = gui.addFolder('Cone (Red)');
coneFolder.add(cube1.position, 'y').min(-5).max(3).step(0.1);
coneFolder.addColor(material1, 'color');
coneFolder.add(cube1, 'visible');
coneFolder.add(material1, 'wireframe');
coneFolder.add(material1, 'metalness').min(0).max(1).step(0.01);
coneFolder.add(material1, 'roughness').min(0).max(1).step(0.01);
coneFolder.open();

// Torus (Green)
const greenTorusFolder = gui.addFolder('Torus (Green)');
greenTorusFolder.add(cube2.position, 'y').min(-5).max(3).step(0.1);
greenTorusFolder.addColor(material2, 'color');
greenTorusFolder.add(cube2, 'visible');
greenTorusFolder.add(material2, 'wireframe');
greenTorusFolder.add(material2, 'metalness').min(0).max(1).step(0.01);
greenTorusFolder.add(material2, 'roughness').min(0).max(1).step(0.01);
greenTorusFolder.open();

// Sphere (Textured)
const sphereFolder = gui.addFolder('Sphere (Textured)');
sphereFolder.add(cube3.position, 'y').min(-5).max(3).step(0.1);
sphereFolder.addColor(material3, 'color');
sphereFolder.add(cube3, 'visible');
sphereFolder.add(material3, 'wireframe');
sphereFolder.add(material3, 'metalness').min(0).max(1).step(0.01);
sphereFolder.add(material3, 'roughness').min(0).max(1).step(0.01);
sphereFolder.open();

// GLTF Loader
const gltfLoader = new GLTFLoader();
let carModel = null;

// Drift variables
let driftAngle = 0;
const driftRadius = 5;
const driftSpeed = 0.02;

// Smoke particle array
const smokeParticles = [];

// Create smoke puff
function createSmoke(position) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
    });
    const smoke = new THREE.Mesh(geometry, material);
    smoke.position.copy(position);
    scene.add(smoke);
    smokeParticles.push(smoke);
}

// Update smoke particles
function updateSmoke(delta) {
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const s = smokeParticles[i];
        s.position.y += 0.02 * delta * 60; // scale with delta
        s.material.opacity -= 0.008 * delta * 60; // fade scaled by delta
        s.scale.multiplyScalar(1 + 0.02 * delta * 60); // expand
        if (s.material.opacity <= 0) {
            scene.remove(s);
            smokeParticles.splice(i, 1);
        }
    }
}

// Load the GLTF (your model)
gltfLoader.load(
    '/static/models/Charecters_Henry.gltf',
    (gltf) => {
        carModel = gltf.scene;
        // optionally center or adjust model here
        carModel.scale.set(1, 1, 1);
        carModel.position.set(driftRadius, 0, 0);
        scene.add(carModel);

        // If the model has animations, create mixer and play the first clip
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(carModel);
            // play all clips or choose one; here we play the first
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }

        // GUI for GLTF (optional)
        const gltfFolder = gui.addFolder('GLTF Model');
        gltfFolder.add(carModel.position, 'x').min(-10).max(10).step(0.1).name('Pos X');
        gltfFolder.add(carModel.position, 'y').min(-5).max(5).step(0.1).name('Pos Y');
        gltfFolder.add(carModel.position, 'z').min(-10).max(10).step(0.1).name('Pos Z');
        gltfFolder.add(carModel.rotation, 'x').min(-Math.PI).max(Math.PI).step(0.01).name('Rot X');
        gltfFolder.add(carModel.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.01).name('Rot Y');
        gltfFolder.add(carModel.rotation, 'z').min(-Math.PI).max(Math.PI).step(0.01).name('Rot Z');
        gltfFolder.add(carModel.scale, 'x').min(0.01).max(5).step(0.01).name('Scale X');
        gltfFolder.add(carModel.scale, 'y').min(0.01).max(5).step(0.01).name('Scale Y');
        gltfFolder.add(carModel.scale, 'z').min(0.01).max(5).step(0.01).name('Scale Z');
        gltfFolder.open();
    },
    undefined,
    (error) => {
        console.error('Error loading GLTF model:', error);
    }
);

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    const delta = clock.getDelta();

    // update model animation mixer if available
    if (mixer) mixer.update(delta);

    // rotate the sample sphere
    cube3.rotation.x += 0.01;
    cube3.rotation.y += 0.01;

    // Drifting car logic + smoke
    if (carModel) {
        driftAngle += driftSpeed;
        carModel.position.x = Math.cos(driftAngle) * driftRadius;
        carModel.position.z = Math.sin(driftAngle) * driftRadius;

        // Keep the model's root rotation for the drift (note: mixer will still animate bones)
        carModel.rotation.y = -driftAngle - Math.PI / 8; // angled for drift

        // Get rear wheel positions (adjust offsets for your particular model)
        // Offsets are in model-local space; rotate them by carModel.rotation.y to world
        const offsetLeft = new THREE.Vector3(-0.5, 0.2, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), carModel.rotation.y);
        const offsetRight = new THREE.Vector3(0.5, 0.2, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), carModel.rotation.y);

        const backLeft = new THREE.Vector3().copy(carModel.position).add(offsetLeft);
        const backRight = new THREE.Vector3().copy(carModel.position).add(offsetRight);

        // spawn smoke occasionally to avoid too many particles: spawn every N frames (approx)
        // simple throttle: only spawn if a random chance passes or based on time
        if (Math.random() < 0.6) {
            createSmoke(backLeft);
        }
        if (Math.random() < 0.6) {
            createSmoke(backRight);
        }
    }

    updateSmoke(delta);
    controls.update();
    renderer.render(scene, camera);
}
