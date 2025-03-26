// app.js

// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", async () => {
    const video = document.getElementById('cameraFeed');
    const cameraSelect = document.getElementById('cameraSelect');
    const ceilingInput = document.getElementById('ceilingHeightInput');
    const updateCoverageButton = document.getElementById('updateCoverage');

    // List all available video input devices (cameras)
    async function listCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error listing cameras:", error);
            alert("Unable to access camera devices.");
        }
    }

    // Start the camera feed using the selected device
    async function startCamera(deviceId) {
        const constraints = {
            video: { deviceId: { exact: deviceId } }
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Error accessing the selected camera. Please check permissions.");
        }
    }

    // Populate the camera dropdown and start with the first available camera
    await listCameras();
    if (cameraSelect.options.length > 0) {
        startCamera(cameraSelect.options[0].value);
    } else {
        alert("No cameras found on this device.");
    }

    // Change camera when user selects a different option
    cameraSelect.addEventListener('change', (event) => {
        startCamera(event.target.value);
    });

    // Listen for clicks/taps on the video feed for sensor placement
    video.addEventListener('click', (event) => {
        const rect = video.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        console.log("Sensor placed at:", x, y);
        // Call Three.js function to update sensor position
        updateSensorPositionInThreeD(x, y);
    });

    // Update 3D coverage area when the user enters a ceiling height and clicks the button
    updateCoverageButton.addEventListener('click', () => {
        const ceilingHeightFt = parseFloat(ceilingInput.value);
        if (isNaN(ceilingHeightFt)) {
            alert("Please enter a valid ceiling height.");
            return;
        }
        updateCoverageArea(ceilingHeightFt);
    });
});
