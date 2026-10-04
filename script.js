const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const GRID = 110; // ডটের সংখ্যা (বেশি = সূক্ষ্ম)
const COLOR = [182, 255, 0]; // সবুজ
const small = document.createElement('canvas');
const sctx = small.getContext('2d', { willReadFrequently: true });
let handLandmarker, W, H;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function dither() {
const w = small.width, h = small.height;
sctx.save();
sctx.translate(w, 0); sctx.scale(-1, 1); // mirror
sctx.drawImage(video, 0, 0, w, h);
sctx.restore();
const img = sctx.getImageData(0, 0, w, h);
const d = img.data;
for (let y = 0; y < h; y++) {
for (let x = 0; x < w; x++) {
const i = (y * w + x) * 4;
const g = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
const t = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
const on = g > t;
d[i] = on ? COLOR[0] : 0;
d[i + 1] = on ? COLOR[1] : 0;
d[i + 2] = on ? COLOR[2] : 0;
d[i + 3] = 255;
}
}
sctx.putImageData(img, 0, 0);
ctx.imageSmoothingEnabled = false;
ctx.drawImage(small, 0, 0, W, H);
}

function getQuad(hands) {
const pts = [];
for (const hand of hands) {
for (const i of [4, 8]) {
pts.push({ x: (1 - hand[i].x) * W, y: hand[i].y * H });
}
}
const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
pts.sort((a, b) =>
Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
return pts;
}

function loop() {
// ১) স্বাভাবিক ভিডিও (mirror)
ctx.save();
ctx.translate(W, 0); ctx.scale(-1, 1);
ctx.drawImage(video, 0, 0, W, H);
ctx.restore();

// ২) দুই হাত থাকলে শুধু ফ্রেমের ভেতরে dither
const res = handLandmarker.detectForVideo(video, performance.now());
if (res.landmarks.length === 2) {
const q = getQuad(res.landmarks);
ctx.save();
ctx.beginPath();
ctx.moveTo(q[0].x, q[0].y);
q.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
ctx.closePath();
ctx.clip();
dither();
ctx.restore();

ctx.strokeStyle = 'white'; ctx.lineWidth = 2;  
ctx.beginPath();  
ctx.moveTo(q[0].x, q[0].y);  
q.slice(1).forEach(p => ctx.lineTo(p.x, p.y));  
ctx.closePath(); ctx.stroke();

}
requestAnimationFrame(loop);
}

async function start() {
startBtn.disabled = true;
statusEl.textContent = 'লোড হচ্ছে...';
const stream = await navigator.mediaDevices.getUserMedia({
video: { facingMode: 'user' }, audio: false
});
video.srcObject = stream;
video.playsInline = true;
await video.play();

W = canvas.width = video.videoWidth;
H = canvas.height = video.videoHeight;
small.width = GRID;
small.height = Math.round(GRID * H / W);

const { HandLandmarker, FilesetResolver } = await import(
'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
);
const fileset = await FilesetResolver.forVisionTasks(
'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
);
handLandmarker = await HandLandmarker.createFromOptions(fileset, {
baseOptions: {
modelAssetPath:
'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
},
runningMode: 'VIDEO',
numHands: 2
});

statusEl.textContent = 'Camera চালু হয়েছে! দুই হাত দিয়ে ফ্রেম বানান।';
loop();
}

startBtn.addEventListener('click', start);
