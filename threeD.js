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
let sensorMarker = { x: 0, y: 0 }; // Placeholder for sensor position (for future extension)

// Initialize Three.js scene, camera, renderer, and lights
function initThreeJS() {
    const container = document.getElementById('threeDContainer');
    scene = new THREE.Scene();

    // Set up perspective camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Set up WebGL renderer and add its canvas to the container
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Create an initial sensor coverage shape (using default values, e.g., for 10 ft ceiling)
    sensorCoverage = createCoverageShape(10.0, 3.05, 3.75);
    scene.add(sensorCoverage);

    animate();
}

// Create (or recreate) a sensor coverage shape as a cone
// Parameters: ceilingHeight (ft), fovWidth (m), fovLength (m)
// In this model, the sensor is the cone's tip (mounted on the ceiling) and the cone expands downwards.
function createCoverageShape(ceilingHeight, fovWidth, fovLength) {
    // For simplicity, we use a cone geometry where:
    // - height is equal to the ceiling height (in meters)
    // - base radius is approximated as half the FoV width
    const height = ceilingHeight; // Note: For a more accurate model, consider converting feet to meters if needed.
    const radius = fovWidth / 2;

    // Create a cone geometry
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true,
        wireframe: false
    });
    const cone = new THREE.Mesh(geometry, material);

    // Adjust position so that the tip (sensor) remains at y = 0.
    // The default cone geometry is centered; we shift it downward.
    cone.position.y = -height / 2;
    return cone;
}

// Update the 3D coverage area based on the user-entered ceiling height (in ft)
// The lookup table provides the corresponding FoV width and length (in meters)
function updateCoverageArea(ceilingHeightFt) {
    const ceilingData = getCeilingData(ceilingHeightFt);
    if (!ceilingData) {
        alert("Ceiling height not available in table. Please enter a valid value.");
        return;
    }

    // Remove the previous coverage shape
    if (sensorCoverage) {
        scene.remove(sensorCoverage);
    }

    // Create and add the updated coverage shape
    sensorCoverage = createCoverageShape(ceilingHeightFt, ceilingData.width, ceilingData.length);
    scene.add(sensorCoverage);
}

// Find the closest matching FoV data in the lookup table for the given ceiling height (ft)
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

// Update sensor position in the 3D scene based on click coordinates from the video feed
// (For a more advanced implementation, you would convert screen coordinates to 3D world coordinates)
function updateSensorPositionInThreeD(x, y) {
    sensorMarker.x = x;
    sensorMarker.y = y;
    console.log("Sensor position updated (placeholder):", sensorMarker);
    // Future enhancement: Visualize the sensor position in the 3D scene.
}

// Animation loop using requestAnimationFrame for smooth rendering
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Initialize Three.js when the DOM is ready
document.addEventListener("DOMContentLoaded", initThreeJS);

// Expose functions to the global scope so that app.js can call them
window.updateCoverageArea = updateCoverageArea;
window.updateSensorPositionInThreeD = updateSensorPositionInThreeD;
