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

    // Set up perspective camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    // Position the camera so that (0,0,0) is at the sensor (ceiling mount)
    camera.position.set(0, 5, 10);

    // Set up WebGL renderer; its canvas overlays the video
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Ensure the canvas is absolutely positioned (CSS already does this)
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Create an initial sensor coverage shape (default: 10 ft ceiling)
    sensorCoverage = createCoverageShape(10.0, 3.05, 3.75);
    // Initially position the coverage shape at the center
    sensorCoverage.position.x = sensorOffset.x;
    sensorCoverage.position.y = sensorOffset.y;
    scene.add(sensorCoverage);

    animate();
}

// Create (or recreate) a sensor coverage shape as a cone.
// The cone’s height is the ceiling height (in meters) and its base radius is derived from FoV width.
function createCoverageShape(ceilingHeight, fovWidth, fovLength) {
    const height = ceilingHeight; // using ft for simplicity; conversion can be added if needed.
    const radius = fovWidth / 2;
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true,
        wireframe: false
    });
    const cone = new THREE.Mesh(geometry, material);
    // Shift the cone so its tip (sensor location) is at y=0.
    cone.position.y = -height / 2;
    return cone;
}

// Update the 3D coverage area based on the user-entered ceiling height (in ft)
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
    // Reapply sensor offset so that the shape overlays at the tapped position
    sensorCoverage.position.x = sensorOffset.x;
    sensorCoverage.position.y = sensorOffset.y;
    scene.add(sensorCoverage);
}

// Get the closest matching FoV data for a given ceiling height (ft)
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

// Update the sensor’s 3D coverage overlay position based on normalized coordinates (range -1 to 1).
// Here we simply map the normalized coordinates to a translation in the scene.
function updateSensorPositionInThreeD(normX, normY) {
    sensorOffset.set(normX, normY);
    if (sensorCoverage) {
        // For demonstration, we map normalized coordinates to a small offset.
        // In a real AR scenario, you would unproject these into 3D space.
        sensorCoverage.position.x = normX * 5; // scaling factor (adjust as needed)
        sensorCoverage.position.y = normY * 5;
    }
}

// Animation loop for rendering
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Initialize Three.js when DOM is ready
document.addEventListener("DOMContentLoaded", initThreeJS);

// Expose functions for app.js to call
window.updateCoverageArea = updateCoverageArea;
window.updateSensorPositionInThreeD = updateSensorPositionInThreeD;
