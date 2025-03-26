// app.js

document.addEventListener("DOMContentLoaded", async () => {
    const video = document.getElementById('cameraFeed');
    const cameraSelect = document.getElementById('cameraSelect');
    const ceilingInput = document.getElementById('ceilingHeightInput');
    const updateCoverageButton = document.getElementById('updateCoverage');

    // Request a default video stream to prompt permissions
    async function requestInitialPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop the tracks immediately since this stream is only for permissions
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error("Permission denied or error obtaining video:", error);
            alert("Camera permission is required for this app.");
        }
    }

    // List available video input devices after permission is granted
    async function listCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                // Some devices may not show a label until permission is granted
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
        // Use the deviceId in constraints; if none provided, default to environment if possible.
        const constraints = {
            video: deviceId
                ? { deviceId: { exact: deviceId } }
                : { facingMode: { ideal: "environment" } }
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Error accessing the selected camera. Please check permissions.");
        }
    }

    // Request permissions and then list cameras
    await requestInitialPermission();
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

    // Listen for taps/clicks on the video for sensor placement
    video.addEventListener('click', (event) => {
        const rect = video.getBoundingClientRect();
        // Calculate normalized coordinates in range [-1, 1]
        const normX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        console.log("Normalized sensor position:", normX, normY);
        // Update sensor coverage overlay in Three.js (mapping normalized coords)
        updateSensorPositionInThreeD(normX, normY);
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
