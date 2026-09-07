/**
 * Audio alert and tab notification helpers for worker dashboard
 */

let originalTabTitle: string = typeof document !== "undefined" ? document.title : "MenuOS Dashboard";
let flashInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Play a clear, high-fidelity kitchen chime using Web Audio API
 */
export function playNewOrderAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp chime (987.77 Hz - B5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: Harmonious resonance (1318.51 Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn("Could not play audio alert:", err);
  }
}

/**
 * Flash the browser tab title when a new order arrives
 */
export function flashTabTitle(alertText: string) {
  stopFlashingTitle();
  if (typeof document === "undefined") return;

  originalTabTitle = document.title;
  let isAlert = true;

  flashInterval = setInterval(() => {
    document.title = isAlert ? `🔔 ${alertText}` : originalTabTitle;
    isAlert = !isAlert;
  }, 900);

  // Stop flashing when window gets focused
  const handleInteraction = () => {
    stopFlashingTitle();
    window.removeEventListener("focus", handleInteraction);
    window.removeEventListener("click", handleInteraction);
  };

  window.addEventListener("focus", handleInteraction, { once: true });
  window.addEventListener("click", handleInteraction, { once: true });
}

/**
 * Stop flashing title and restore original title
 */
export function stopFlashingTitle() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  if (typeof document !== "undefined" && originalTabTitle) {
    document.title = originalTabTitle;
  }
}
