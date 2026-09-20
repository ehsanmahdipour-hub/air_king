import type { GameSettings } from '@game/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => Promise<void>;
  onClose: () => void;
}

const VOLUME_DEBOUNCE_MS = 300;

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState<GameSettings>(settings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<GameSettings | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const persist = useCallback(async (next: GameSettings) => {
    setSaving(true);
    setError(null);
    try {
      await onChangeRef.current(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }, []);

  // Flush a pending debounced change when the panel closes.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (pendingRef.current) {
        void onChangeRef.current(pendingRef.current).catch(() => undefined);
        pendingRef.current = null;
      }
    };
  }, []);

  function apply(next: GameSettings, debounce = false): void {
    setDraft(next);
    pendingRef.current = next;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (debounce) {
      timerRef.current = setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) {
          void persist(pending);
        }
      }, VOLUME_DEBOUNCE_MS);
    } else {
      pendingRef.current = null;
      void persist(next);
    }
  }

  return (
    <section className="settings">
      <header className="panel__header">
        <h2>Settings</h2>
        <button type="button" className="app__button" onClick={onClose}>
          Close
        </button>
      </header>

      {error && <p className="upgrades__error">{error}</p>}
      {saving && <p className="settings__saving">Saving…</p>}

      <div className="settings__grid">
        <fieldset className="settings__group">
          <legend>Controls</legend>

          <label className="settings__field">
            Movement
            <select
              value={draft.movement}
              onChange={(event) =>
                apply({ ...draft, movement: event.target.value as GameSettings['movement'] })
              }
            >
              <option value="wasd">WASD</option>
              <option value="arrows">Arrow Keys</option>
              <option value="mouse">Mouse</option>
            </select>
          </label>

          <label className="settings__field">
            Shooting
            <select
              value={draft.shooting}
              onChange={(event) =>
                apply({ ...draft, shooting: event.target.value as GameSettings['shooting'] })
              }
            >
              <option value="space">Space</option>
              <option value="mouse">Mouse</option>
              <option value="both">Both</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="settings__group">
          <legend>Audio</legend>

          <label className="settings__check">
            <input
              type="checkbox"
              checked={draft.musicEnabled}
              onChange={(event) => apply({ ...draft, musicEnabled: event.target.checked })}
            />
            Music
          </label>

          <label className="settings__check">
            <input
              type="checkbox"
              checked={draft.sfxEnabled}
              onChange={(event) => apply({ ...draft, sfxEnabled: event.target.checked })}
            />
            Sound effects
          </label>

          <VolumeSlider
            label="Master volume"
            value={draft.masterVolume}
            onChange={(value) => apply({ ...draft, masterVolume: value }, true)}
          />
          <VolumeSlider
            label="Music volume"
            value={draft.musicVolume}
            onChange={(value) => apply({ ...draft, musicVolume: value }, true)}
          />
          <VolumeSlider
            label="SFX volume"
            value={draft.sfxVolume}
            onChange={(value) => apply({ ...draft, sfxVolume: value }, true)}
          />
        </fieldset>
      </div>
    </section>
  );
}

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function VolumeSlider({ label, value, onChange }: VolumeSliderProps) {
  return (
    <label className="settings__field">
      <span>
        {label} — {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}