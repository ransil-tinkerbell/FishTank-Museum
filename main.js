import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ---------- Basic Three.js Setup ----------
const app = document.getElementById('app');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// ---------- Load HDR environment ----------
const hdrLoader = new RGBELoader();
hdrLoader.load('static/environmentMaps/hall_of_finfish_2k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
  hideLoading();
});

// ---------- Controls ----------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.enableZoom = true;
orbit.rotateSpeed = 0.3;

// ---------- GLTF Loader ----------
const loader = new GLTFLoader();

// Main Character (Deep Sea Fish)
// let fish;
// loader.load('static/models/deep_sea_fish_3dsm4.glb', (gltf) => {
//   fish = gltf.scene;
//   fish.scale.set(0.6, 0.6, 0.6);
//   fish.position.set(0, 0, 0);
//   scene.add(fish);
// });

// Museum Showpieces
const showpieces = [];

loader.load('static/models/jelly_fish.glb', (gltf) => {
  const jelly = gltf.scene;
  jelly.scale.set(0.5, 0.5, 0.5);
  jelly.position.set(3, 1, -2);
  scene.add(jelly);
  showpieces.push({ object: jelly, name: 'Jellyfish', description: 'A delicate jellyfish floating gracefully, representing the elegance of deep sea creatures.' });
});

loader.load('static/models/koi_fish.glb', (gltf) => {
  const koi = gltf.scene;
  koi.scale.set(0.8, 0.8, 0.8);
  koi.position.set(-3, 0.5, -2);
  scene.add(koi);
  showpieces.push({ object: koi, name: 'Koi Fish', description: 'Koi fish are ornamental varieties of the common carp, celebrated for their vivid colors and symbolism in Asian culture.' });
});

loader.load('static/models/fish.glb', (gltf) => {
  const goldfish = gltf.scene;
  goldfish.scale.set(0.7, 0.7, 0.7);
  goldfish.position.set(0, 1, -5);
  scene.add(goldfish);
  showpieces.push({ object: goldfish, name: 'Goldfish', description: 'Goldfish are one of the most common aquarium fish, admired for their beauty and peaceful presence.' });
});

// ---------- Movement Options for Main Fish ----------
window.addEventListener('keydown', (e) => {
  if (!fish) return;
  const step = 0.2;
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') fish.position.z -= step;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') fish.position.z += step;
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') fish.position.x -= step;
  if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') fish.position.x += step;
  if (e.key.toLowerCase() === 'q') fish.position.y += step;
  if (e.key.toLowerCase() === 'e') fish.position.y -= step;
});

// ---------- Hotspots (Information labels for showpieces) ----------
const labels = [];
function addHotspot({ name, description, position }) {
  const hotspot = { name, description, pos: position };

  const el = document.createElement('div');
  el.className = 'label';
  el.textContent = name;
  el.addEventListener('click', () => openPanel(hotspot));
  document.body.appendChild(el);

  labels.push({ el, pos: position, hotspot });
  return hotspot;
}

const HOTSPOTS = [
  addHotspot({
    name: 'Jellyfish',
    description: 'A delicate jellyfish floating gracefully, representing the elegance of deep sea creatures.',
    position: new THREE.Vector3(3, 1, -2)
  }),
  addHotspot({
    name: 'Koi Fish',
    description: 'Koi fish are ornamental varieties of the common carp, celebrated for their vivid colors and symbolism in Asian culture.',
    position: new THREE.Vector3(-3, 0.5, -2)
  }),
  addHotspot({
    name: 'Goldfish',
    description: 'Goldfish are one of the most common aquarium fish, admired for their beauty and peaceful presence.',
    position: new THREE.Vector3(0, 1, -5)
  })
];

// ---------- Panel ----------
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panelTitle');
const panelBody = document.getElementById('panelBody');
const panelClose = document.getElementById('panelClose');
panelClose.addEventListener('click', () => panel.classList.remove('open'));

function openPanel(h){
  panelTitle.textContent = h.name;
  panelBody.textContent = h.description;
  panel.classList.add('open');
}

// ---------- Labels update ----------
function updateLabels(){
  for (const { el, pos } of labels){
    const p = pos.clone().project(camera);
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = ( -p.y * 0.5 + 0.5) * window.innerHeight;
    const isBehind = p.z > 1;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = isBehind ? 'none' : 'block';
  }
}

// ---------- Animate ----------
function animate(){
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
  updateLabels();
}
animate();

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Helpers ----------
function toast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.style.display='block'; clearTimeout(t._to); t._to=setTimeout(()=>t.style.display='none', 1400); }
function hideLoading(){ const el = document.getElementById('loading'); if (el) el.style.display='none'; }
