// threeD.js

// Lookup table for FoV data based on ceiling height (in feet)
// Each entry maps a ceiling height to FoV width and length (in meters)
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

// Global Three.js variables
let scene, camera, renderer, sensorCoverage;
let sensorOffset = new THREE.Vector2(0, 0); // Normalized sensor offset

// Initialize Three.js scene, camera, and renderer
function initThreeJS() {
    const container = document.getElementById('cameraContainer');
    scene = new THREE.Scene();

    // Set up perspective camera.
    // (In this demo, we position the camera at a default location.)
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Set up WebGL renderer with alpha so that it overlays transparently over the video.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add lighting to the scene.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Create an initial sensor coverage shape (default: 10 ft ceiling)
    sensorCoverage = createCoverageShape(10.0, 3.05, 3.75);
    // Position the sensor coverage based on any tapped offset (initially centered).
    sensorCoverage.position.x = sensorOffset.x;
    sensorCoverage.position.y = sensorOffset.y;
    scene.add(sensorCoverage);

    // Optionally, update camera orientation based on device movement.
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleDeviceOrientation, true);
    }

    animate();
}

// Create a sensor coverage shape as a cone.
// The cone’s height is the ceiling height (in ft) and its base radius comes from the FoV width.
function createCoverageShape(ceilingHeight, fovWidth, fovLength) {
    const height = ceilingHeight; // Using ft for simplicity (add conversion if needed).
    const radius = fovWidth / 2;
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true,
        wireframe: false
    });
    const cone = new THREE.Mesh(geometry, material);
    // Shift the cone so that its tip (sensor mount) is at y = 0.
    cone.position.y = -height / 2;
    return cone;
}

// Update the 3D coverage area when the ceiling height is changed.
function updateCoverageArea(ceilingHeightFt) {
    const ceilingData = getCeilingData(ceilingHeightFt);
    if (!ceilingData) {
        alert("Ceiling height not available in table. Please enter a valid value.");
        return;
    }
    if (sensorCoverage) {
        scene.remove(sensorCoverage);
    }
    sensorCoverage = createCoverageShape(ceilingHeightFt, ceilingData.width, ceilingData.length);
    // Reapply sensor offset so that the shape remains aligned with the tap position.
    sensorCoverage.position.x = sensorOffset.x;
    sensorCoverage.position.y = sensorOffset.y;
    scene.add(sensorCoverage);
}

// Find the closest FoV data based on a given ceiling height (ft).
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

// Update the sensor’s overlay position based on normalized coordinates (range -1 to 1).
function updateSensorPositionInThreeD(normX, normY) {
    sensorOffset.set(normX, normY);
    if (sensorCoverage) {
        // Map normalized coordinates to scene space.
        // Here a scaling factor of 5 is applied (adjust as needed).
        sensorCoverage.position.x = normX * 5;
        sensorCoverage.position.y = normY * 5;
    }
}

// Handle device orientation events to update camera rotation.
function handleDeviceOrientation(event) {
    // Basic mapping of device orientation to camera rotation.
    // Note: For production apps, consider using DeviceOrientationControls.
    if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        camera.rotation.y = THREE.Math.degToRad(event.alpha);
        camera.rotation.x = THREE.Math.degToRad(event.beta);
        camera.rotation.z = THREE.Math.degToRad(event.gamma);
    }
}

// Animation loop: update the renderer and adjust the sensor drawing scale based on camera distance.
function animate() {
    requestAnimationFrame(animate);

    // Adjust the scale of sensorCoverage relative to the camera's distance.
    // Here we assume that when the camera is at distance 10, scale is 1.
    if (sensorCoverage) {
        const sensorPos = new THREE.Vector3(sensorCoverage.position.x, sensorCoverage.position.y, 0);
        const dist = camera.position.distanceTo(sensorPos);
        const scaleFactor = dist / 10; // Modify this factor as needed.
        sensorCoverage.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
    renderer.render(scene, camera);
}

// Initialize Three.js when the DOM is ready.
document.addEventListener("DOMContentLoaded", initThreeJS);

// Expose functions so that arApp.js can call them.
window.updateCoverageArea = updateCoverageArea;
window.updateSensorPositionInThreeD = updateSensorPositionInThreeD;
