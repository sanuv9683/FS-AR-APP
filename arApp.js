// arApp.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/webxr/ARButton.js';

/* 1. FoV Lookup Table (ceiling height in ft => coverage in meters) */
const fovTable = [
    { ceiling: 7.5, width: 2.35, length: 2.90 },
    { ceiling: 8.0, width: 2.50, length: 3.00 },
    { ceiling: 9.0, width: 2.74, length: 3.47 },
    { ceiling: 10.0, width: 3.05, length: 3.75 },
    { ceiling: 10.5, width: 3.26, length: 4.08 },
    { ceiling: 11.0, width: 3.44, length: 4.33 },
    { ceiling: 11.5, width: 3.66, length: 4.63 },
    { ceiling: 12.0, width: 3.90, length: 4.88 },
    { ceiling: 13.0, width: 4.21, length: 5.30 },
    { ceiling: 14.0, width: 4.51, length: 5.64 }
];

/* 2. Variables for Three.js Scene */
let camera, scene, renderer;
let sensorCoverage;
let controller; // for user taps in AR

/* 3. Check AR Support Before Initializing */
const fallbackDiv = document.getElementById('fallback');
if ('xr' in navigator) {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
            initAR(); // proceed with AR setup
        } else {
            showFallback();
        }
    });
} else {
    showFallback();
}

function showFallback() {
    fallbackDiv.classList.remove('hidden');
}

/* 4. AR Initialization */
function initAR() {
    const container = document.getElementById('arContainer');

    // Create scene & camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Add AR button to enter AR mode
    document.body.appendChild(
        ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'] // or remove if you don't need hit-test
        })
    );

    // Add a basic light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Create default coverage shape
    const defaultCeiling = 10.0;
    const defaultData = getCeilingData(defaultCeiling);
    sensorCoverage = createCoverageShape(defaultCeiling, defaultData.width, defaultData.length);
    // Place it 2 meters in front of the camera initially
    sensorCoverage.position.set(0, 0, -2);
    scene.add(sensorCoverage);

    // Set up AR controller for user taps (to reposition coverage if needed)
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Handle coverage updates from UI
    document.getElementById('updateCoverage').addEventListener('click', () => {
        const val = parseFloat(document.getElementById('ceilingHeightInput').value);
        if (isNaN(val)) {
            alert("Please enter a valid ceiling height.");
            return;
        }
        updateCoverageArea(val);
    });

    animate();
}

/* 5. Coverage Table & Shape */
function getCeilingData(ceilingHeightFt) {
    let closest = null;
    let minDiff = Infinity;
    fovTable.forEach((data) => {
        const diff = Math.abs(data.ceiling - ceilingHeightFt);
        if (diff < minDiff) {
            minDiff = diff;
            closest = data;
        }
    });
    return closest;
}

function createCoverageShape(ceilingFt, fovWidthM, fovLengthM) {
    // For simplicity, use 'ceilingFt' as the cone height in ft.
    // Convert if you want a more realistic scale in meters.
    const height = ceilingFt;
    const radius = fovWidthM / 2;

    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true
    });
    const cone = new THREE.Mesh(geometry, material);

    // Shift so the tip is at the origin
    cone.position.y = -height / 2;
    return cone;
}

function updateCoverageArea(ceilingHeightFt) {
    const data = getCeilingData(ceilingHeightFt);
    if (!data) {
        alert("No matching data found for that height.");
        return;
    }
    // Remove old coverage
    if (sensorCoverage) scene.remove(sensorCoverage);

    sensorCoverage = createCoverageShape(ceilingHeightFt, data.width, data.length);
    // Keep it in front of the camera
    sensorCoverage.position.set(0, 0, -2);
    scene.add(sensorCoverage);
}

/* 6. User Tap: Reposition coverage (basic example) */
function onSelect() {
    if (!sensorCoverage) return;
    // In a production app, you'd do a real AR hit test here.
    // For demonstration, just reset it 2 meters ahead again.
    sensorCoverage.position.set(0, 0, -2);
}

/* 7. Resize Handler */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* 8. Animation & Render Loop */
function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    // Scale coverage based on distance from camera for a "try-on" effect
    if (sensorCoverage) {
        const dist = sensorCoverage.position.distanceTo(camera.position);
        const scaleFactor = dist / 2; // Tweak this factor as needed
        sensorCoverage.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    renderer.render(scene, camera);
}
