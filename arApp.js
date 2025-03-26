// arApp.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/webxr/ARButton.js';

// Lookup table: Maps ceiling height (ft) to FoV width and length (in meters)
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

// Global variables
let camera, scene, renderer, sensorCoverage;
let controller;

// Returns the closest matching FoV data for the entered ceiling height
function getCeilingData(ceilingHeightFt) {
    let closest = null;
    let minDiff = Infinity;
    fovTable.forEach(data => {
        const diff = Math.abs(data.ceiling - ceilingHeightFt);
        if (diff < minDiff) {
            minDiff = diff;
            closest = data;
        }
    });
    return closest;
}

// Create the sensor coverage shape as a cone. In this model, the cone's tip is the sensor mount.
function createCoverageShape(ceilingHeight, fovWidth, fovLength) {
    const height = ceilingHeight; // Assume the same unit (ft) for simplicity.
    const radius = fovWidth / 2;
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true,
        wireframe: false
    });
    const cone = new THREE.Mesh(geometry, material);
    // Shift the cone so that its tip (sensor) is at the origin.
    cone.position.y = -height / 2;
    return cone;
}

// Update the sensor coverage object when the user changes the ceiling height.
function updateCoverageArea(ceilingHeightFt) {
    const ceilingData = getCeilingData(ceilingHeightFt);
    if (!ceilingData) {
        alert("Ceiling height not available in table. Please enter a valid value.");
        return;
    }
    // Remove the old sensor coverage shape from the scene.
    if (sensorCoverage) scene.remove(sensorCoverage);
    sensorCoverage = createCoverageShape(ceilingHeightFt, ceilingData.width, ceilingData.length);
    // Place the sensor coverage 2 meters in front of the camera (or update based on hit test)
    sensorCoverage.position.set(0, 0, -2);
    scene.add(sensorCoverage);
}

// Initialize the AR scene.
function init() {
    const container = document.getElementById('arContainer');

    // Set up scene and camera.
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Set up renderer with WebXR enabled.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Add the AR button to enter AR mode.
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    // Add basic lighting.
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Create the default sensor coverage shape using a default ceiling height (10 ft).
    const defaultCeiling = 10.0;
    const defaultData = getCeilingData(defaultCeiling);
    sensorCoverage = createCoverageShape(defaultCeiling, defaultData.width, defaultData.length);
    // Initially position the sensor coverage 2 meters in front of the camera.
    sensorCoverage.position.set(0, 0, -2);
    scene.add(sensorCoverage);

    // Set up a controller for tap interaction (to reposition the sensor coverage).
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Handle window resizing.
    window.addEventListener('resize', onWindowResize, false);

    // Update coverage shape on ceiling height change.
    document.getElementById('updateCoverage').addEventListener('click', () => {
        const ceilingHeightFt = parseFloat(document.getElementById('ceilingHeightInput').value);
        if (isNaN(ceilingHeightFt)) {
            alert("Please enter a valid ceiling height.");
            return;
        }
        updateCoverageArea(ceilingHeightFt);
    });
}

// When the user taps the screen, update the sensor coverage placement.
// (In a production app you’d use AR hit testing to anchor the object to a real-world surface.)
function onSelect() {
    // For this demo, simply reposition the sensor coverage 2 meters forward.
    sensorCoverage.position.set(0, 0, -2);
}

// Adjust camera and renderer on window resize.
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop: WebXR will update the camera view in real time.
// We also adjust the sensor coverage scale based on its distance from the camera.
function render() {
    // Calculate distance between sensorCoverage and camera.
    const distance = sensorCoverage.position.distanceTo(camera.position);
    // For example, use a scaling factor that is proportional to the distance.
    const scaleFactor = distance / 2; // Adjust this factor to fine-tune the effect.
    sensorCoverage.scale.set(scaleFactor, scaleFactor, scaleFactor);

    renderer.render(scene, camera);
}

function animate() {
    renderer.setAnimationLoop(render);
}

init();
animate();
