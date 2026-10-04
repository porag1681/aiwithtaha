const video = document.getElementById("liveVideo");

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = stream;
    } catch (error) {
        console.log("Camera permission denied:", error);
        alert("Camera permission দিন!");
    }
}

startCamera();
