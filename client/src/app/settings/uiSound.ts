import { DEFAULT_SETTINGS, type GameSettings } from '@game/shared';

let settings: GameSettings = DEFAULT_SETTINGS;
let context: AudioContext | undefined;

/** Keeps UI sounds in sync with the player's audio settings. */
export function setUiAudioSettings(next: GameSettings): void {
  settings = next;
}

/** Best-effort UI click sound for menu/panel buttons. */
export function playUiClick(): void {
  if (!settings.sfxEnabled || settings.masterVolume <= 0 || settings.sfxVolume <= 0) {
    return;
  }

  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return;
    }

    context ??= new Ctor();
    if (context.state === 'suspended') {
      void context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 520;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      0.2 * settings.masterVolume * settings.sfxVolume,
      now + 0.005,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch {
    // UI sound is best-effort.
  }
}