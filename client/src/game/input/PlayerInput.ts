import type { InputState, MovementControl, ShootingControl } from '@game/shared';
import Phaser from 'phaser';

interface ControlKeys {
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  fire: Phaser.Input.Keyboard.Key;
}

export interface PlayerInputSettings {
  movement: MovementControl;
  shooting: ShootingControl;
}

/**
 * Translates raw keyboard and pointer state into an engine-agnostic InputState,
 * honouring the player's control settings. Movement is WASD, arrow keys or the
 * mouse; firing is space, mouse or both. Keys are registered without capture so
 * they never swallow typing in menus or form fields.
 */
export class PlayerInput {
  private readonly keys: ControlKeys;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable');
    }

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const add = (code: number) => keyboard.addKey(code, false, false);

    this.keys = {
      w: add(keyCodes.W),
      a: add(keyCodes.A),
      s: add(keyCodes.S),
      d: add(keyCodes.D),
      up: add(keyCodes.UP),
      down: add(keyCodes.DOWN),
      left: add(keyCodes.LEFT),
      right: add(keyCodes.RIGHT),
      fire: add(keyCodes.SPACE),
    };
  }

  read(settings: PlayerInputSettings): InputState {
    const move = { x: 0, y: 0 };
    const keys = this.keys;

    if (settings.movement === 'wasd') {
      if (keys.a.isDown) move.x -= 1;
      if (keys.d.isDown) move.x += 1;
      if (keys.w.isDown) move.y -= 1;
      if (keys.s.isDown) move.y += 1;
    } else if (settings.movement === 'arrows') {
      if (keys.left.isDown) move.x -= 1;
      if (keys.right.isDown) move.x += 1;
      if (keys.up.isDown) move.y -= 1;
      if (keys.down.isDown) move.y += 1;
    }

    const pointer = this.scene.input.activePointer;
    const spaceFires = settings.shooting !== 'mouse' && keys.fire.isDown;
    const mouseFires = settings.shooting !== 'space' && pointer.leftButtonDown();
    const mouse =
      settings.movement === 'mouse'
        ? { active: true, position: { x: pointer.x, y: pointer.y } }
        : undefined;

    return { move, firing: spaceFires || mouseFires, mouse };
  }
}