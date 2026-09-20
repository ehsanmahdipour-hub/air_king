import { DEFAULT_SETTINGS, type GameSettings } from '@game/shared';

export type SfxName =
  | 'shoot'
  | 'hit'
  | 'explosion'
  | 'boss'
  | 'jingle'
  | 'levelComplete'
  | 'gameOver'
  | 'ui';

const SFX_FREQUENCIES: Record<SfxName, number> = {
  shoot: 880,
  hit: 240,
  explosion: 120,
  boss: 160,
  jingle: 660,
  levelComplete: 780,
  gameOver: 150,
  ui: 520,
};

const MUSIC_NOTES = [220, 277, 330, 277, 196, 247, 294, 247];

/**
 * Minimal synthesized audio: short oscillator blips for effects and a simple
 * looping arpeggio for music. No assets are required, and all output respects
 * the player's persisted audio settings. If Web Audio is unavailable the
 * manager silently no-ops.
 */
export class AudioManager {
  private context?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private settings: GameSettings = DEFAULT_SETTINGS;
  private musicTimer?: ReturnType<typeof setInterval>;
  private musicStep = 0;

  applySettings(settings: GameSettings): void {
    this.settings = settings;
    const context = this.ensure();
    if (!context || !this.master || !this.musicGain || !this.sfxGain) {
      return;
    }

    this.master.gain.value = settings.masterVolume;
    this.musicGain.gain.value = settings.musicEnabled ? settings.musicVolume : 0;
    this.sfxGain.gain.value = settings.sfxEnabled ? settings.sfxVolume : 0;

    if (settings.musicEnabled && settings.musicVolume > 0 && settings.masterVolume > 0) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  playSfx(name: SfxName): void {
    if (!this.settings.sfxEnabled || this.settings.masterVolume <= 0 || this.settings.sfxVolume <= 0) {
      return;
    }
    const context = this.ensure();
    if (!context || !this.sfxGain) {
      return;
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = SFX_FREQUENCIES[name];

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.4), now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain).connect(this.sfxGain);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  dispose(): void {
    this.stopMusic();
    if (this.context) {
      void this.context.close().catch(() => undefined);
      this.context = undefined;
    }
  }

  private startMusic(): void {
    if (this.musicTimer) {
      return;
    }
    this.musicTimer = setInterval(() => this.playMusicNote(), 480);
  }

  private stopMusic(): void {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
  }

  private playMusicNote(): void {
    if (!this.settings.musicEnabled) {
      return;
    }
    const context = this.ensure();
    if (!context || !this.musicGain) {
      return;
    }

    const now = context.currentTime;
    const note = MUSIC_NOTES[this.musicStep % MUSIC_NOTES.length] ?? 220;
    this.musicStep += 1;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    oscillator.connect(gain).connect(this.musicGain);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }

  private ensure(): AudioContext | undefined {
    if (this.context) {
      if (this.context.state === 'suspended') {
        void this.context.resume().catch(() => undefined);
      }
      return this.context;
    }

    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        return undefined;
      }

      const context = new Ctor();
      this.master = context.createGain();
      this.master.connect(context.destination);
      this.musicGain = context.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain = context.createGain();
      this.sfxGain.connect(this.master);
      this.context = context;
      return context;
    } catch {
      return undefined;
    }
  }
}