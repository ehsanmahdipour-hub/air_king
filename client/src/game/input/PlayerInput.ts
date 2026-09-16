import type { InputState } from '@game/shared';
import Phaser from 'phaser';

/** Movement device currently in control. The last device used wins. */
type MoveDevice = 'keyboard' | 'mouse';

interface ControlKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  fire: Phaser.Input.Keyboard.Key;
}

/**
 * Translates raw keyboard and pointer state into an engine-agnostic InputState.
 * Mouse movement targets the pointer directly, so no clicking is required to
 * reposition the aircraft; WASD temporarily takes over while held.
 */
export class PlayerInput {
  private readonly keys: ControlKeys;
  private readonly keyHandlers: Array<{ event: string; handler: () => void }> = [];
  private readonly onPointerMove: () => void;
  private device: MoveDevice = 'mouse';

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

    const useKeyboard = (): void => {
      this.device = 'keyboard';
    };
    for (const key of ['W', 'A', 'S', 'D']) {
      const event = `keydown-${key}`;
      keyboard.on(event, useKeyboard);
      this.keyHandlers.push({ event, handler: useKeyboard });
    }

    this.onPointerMove = () => {
      this.device = 'mouse';
    };
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
  }

  read(): InputState {
    const move = { x: 0, y: 0 };
    if (this.keys.left.isDown) {
      move.x -= 1;
    }
    if (this.keys.right.isDown) {
      move.x += 1;
    }
    if (this.keys.up.isDown) {
      move.y -= 1;
    }
    if (this.keys.down.isDown) {
      move.y += 1;
    }

    const pointer = this.scene.input.activePointer;
    const firing = this.keys.fire.isDown || pointer.leftButtonDown();
    const mouse =
      this.device === 'mouse'
        ? { active: true, position: { x: pointer.x, y: pointer.y } }
        : undefined;

    return { move, firing, mouse };
  }

  dispose(): void {
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      for (const { event, handler } of this.keyHandlers) {
        keyboard.off(event, handler);
      }
    }
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
  }
}
