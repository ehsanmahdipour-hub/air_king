import type { GameSettings } from '@game/shared';
import { useState } from 'react';

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => Promise<void>;
  onClose: () => void;
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<GameSettings>): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await onChange({ ...settings, ...patch });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save settings.');
    } finally {
      setSaving(false);
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
              value={settings.movement}
              onChange={(event) =>
                void update({ movement: event.target.value as GameSettings['movement'] })
              }
            >
              <option value="keyboard">Keyboard (WASD)</option>
              <option value="mouse">Mouse</option>
            </select>
          </label>

          <label className="settings__field">
            Shooting
            <select
              value={settings.shooting}
              onChange={(event) =>
                void update({ shooting: event.target.value as GameSettings['shooting'] })
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
              checked={settings.musicEnabled}
              onChange={(event) => void update({ musicEnabled: event.target.checked })}
            />
            Music
          </label>

          <label className="settings__check">
            <input
              type="checkbox"
              checked={settings.sfxEnabled}
              onChange={(event) => void update({ sfxEnabled: event.target.checked })}
            />
            Sound effects
          </label>

          <VolumeSlider
            label="Master volume"
            value={settings.masterVolume}
            onChange={(value) => void update({ masterVolume: value })}
          />
          <VolumeSlider
            label="Music volume"
            value={settings.musicVolume}
            onChange={(value) => void update({ musicVolume: value })}
          />
          <VolumeSlider
            label="SFX volume"
            value={settings.sfxVolume}
            onChange={(value) => void update({ sfxVolume: value })}
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