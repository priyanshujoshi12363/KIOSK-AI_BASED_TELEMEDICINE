export async function decodeToFloat32(base64, mime) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return decodeTo16k(bytes.buffer);
}

async function decodeTo16k(arrayBuffer) {
  const tmp = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await tmp.decodeAudioData(arrayBuffer);
  tmp.close();
  const frames = Math.ceil(decoded.duration * 16000);
  const offline = new OfflineAudioContext(1, frames, 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

export async function recordUntilSilence({
  maxMs = 12000,
  silenceMs = 1100,
  threshold = 0.018,
  onStart,
  onLevel,
} = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let lastVoice = Date.now();
    let hadVoice = false;

    recorder.start();
    if (onStart) onStart();

    let levelRaf = 0;
    if (onLevel) {
      const levelBuf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(levelBuf);
        let acc = 0;
        for (let i = 0; i < levelBuf.length; i++) {
          const v = (levelBuf[i] - 128) / 128;
          acc += v * v;
        }
        onLevel(Math.min(1, Math.sqrt(acc / levelBuf.length) * 6));
        levelRaf = requestAnimationFrame(tick);
      };
      levelRaf = requestAnimationFrame(tick);
    }

    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const now = Date.now();
      if (rms > threshold) {
        lastVoice = now;
        hadVoice = true;
      }
      if ((hadVoice && now - lastVoice > silenceMs) || now - startedAt > maxMs) {
        clearInterval(timer);
        recorder.stop();
      }
    }, 100);

    recorder.onstop = async () => {
      if (levelRaf) cancelAnimationFrame(levelRaf);
      if (onLevel) onLevel(0);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const arrayBuffer = await blob.arrayBuffer();
      try {
        const audio = await decodeTo16k(arrayBuffer);
        resolve({ audio, hadVoice });
      } catch {
        resolve({ audio: null, hadVoice });
      }
    };
  });
}
