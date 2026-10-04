const video = document.getElementById("camera");
const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");

startBtn.addEventListener("click", async () => {
    try {
        status.textContent = "Camera চালু হচ্ছে...";

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = stream;

        await video.play();

        status.textContent = "Camera চালু হয়েছে!";
        startBtn.textContent = "Camera চলছে";

    } catch (error) {
        console.log(error);
        status.textContent = "Camera permission দেওয়া হয়নি!";
        alert("Camera permission দিন!");
    }
});
