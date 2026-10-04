// ১) এলিমেন্ট ও ভেরিয়েবল
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
let handLandmarker;

// ২) Three.js সেটআপ
const renderer = new THREE.WebGLRenderer({ canvas });
const scene = new THREE.Scene();
const camera = new THREE.Camera();

// ৩) ভিডিও টেক্সচার + shader material
const videoTexture = new THREE.VideoTexture(video);
const material = new THREE.ShaderMaterial({
uniforms: {
uVideo: { value: videoTexture },
uP: { value: [new THREE.Vector2(), new THREE.Vector2(),
new THREE.Vector2(), new THREE.Vector2()] },
uHasQuad: { value: 0 }
},
vertexShader:   varying vec2 vUv;   void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }  ,
fragmentShader:   // আগের পাঠানো shader কোড পুরোটা এখানে   // আর // col = dither(col); এর জায়গায় DITHER_HERE  
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

// ৪) MediaPipe সেটআপ (numHands: 2)
async function init() {
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
await video.play();
renderer.setSize(video.videoWidth, video.videoHeight);
// handLandmarker তৈরি: runningMode 'VIDEO', numHands: 2
loop();
}

// ৫) প্রতি ফ্রেমের লুপ
function loop() {
if (handLandmarker) {
const res = handLandmarker.detectForVideo(video, performance.now());
if (res.landmarks.length === 2) {
let pts = [];
for (const hand of res.landmarks) {
for (const i of [4, 8]) {
pts.push({ x: 1 - hand[i].x, y: 1 - hand[i].y }); // mirror + y উল্টানো
}
}
// কেন্দ্রের চারপাশে angle দিয়ে sort
const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
pts.forEach((p, i) => material.uniforms.uP.value[i].set(p.x, p.y));
material.uniforms.uHasQuad.value = 1;
} else {
material.uniforms.uHasQuad.value = 0;
}
}
renderer.render(scene, camera);
requestAnimationFrame(loop);
}
