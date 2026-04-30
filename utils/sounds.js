// Lightweight sound effects using Web Audio API — no audio files needed.
// All sounds are optional and fail silently if AudioContext is unavailable.

let audioCtx = null;

function getContext() {
  if (!audioCtx && typeof window !== 'undefined' && window.AudioContext) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail — sounds are optional
  }
}

export function playCorrect() {
  playTone(523, 0.15); // C5
  setTimeout(() => playTone(659, 0.15), 100); // E5
  setTimeout(() => playTone(784, 0.2), 200); // G5
}

export function playWrong() {
  playTone(330, 0.25, 'sawtooth', 0.15); // Low buzzy tone
  setTimeout(() => playTone(277, 0.3, 'sawtooth', 0.12), 150);
}

export function playLevelComplete() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 120);
  });
}

export function playGameOver() {
  const notes = [392, 349, 330, 262]; // G4 F4 E4 C4 descending
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), i * 200);
  });
}

export function playClick() {
  playTone(800, 0.05, 'sine', 0.1);
}

export function playAchievement() {
  const notes = [523, 659, 784, 1047, 784, 1047]; // Fanfare
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 100);
  });
}
