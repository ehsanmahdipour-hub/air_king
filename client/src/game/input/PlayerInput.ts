import type { InputState } from '@game/shared';
import Phaser from 'phaser';

interface ControlKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  fire: Phaser.Input.Keyboard.Key;
}

/**
 * Translates raw keyboard and pointer state into an engine-agnostic InputState,
 * honouring the player's control settings: movement is keyboard or mouse, and
 * firing is space, mouse or both.
 */
export class PlayerInput {
  private readonly keys: ControlKeys;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable');
    }

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: keyboard.addKey(keyCodes.W),
      down: keyboard.addKey(keyCodes.S),
      left: keyboard.addKey(keyCodes.A),
      right: keyboard.addKey(keyCodes.D),
      fire: keyboard.addKey(keyCodes.SPACE),
    };
  }

  read(settings: { movement: 'keyboard' | 'mouse'; shooting: 'space' | 'mouse' | 'both' }): InputState {
    const move = { x: 0, y: 0 };

    if (settings.movement === 'keyboard') {
      if (this.keys.left.isDown) move.x -= 1;
      if (this.keys.right.isDown) move.x += 1;
      if (this.keys.up.isDown) move.y -= 1;
      if (this.keys.down.isDown) move.y += 1;
    }

    const pointer = this.scene.input.activePointer;
    const spaceFires = settings.shooting !== 'mouse' && this.keys.fire.isDown;
    const mouseFires = settings.shooting !== 'space' && pointer.leftButtonDown();
    const mouse =
      settings.movement === 'mouse'
        ? { active: true, position: { x: pointer.x, y: pointer.y } }
        : undefined;

    return { move, firing: spaceFires || mouseFires, mouse };
  }
}