// src/game/controls/InputManager.ts
import { FighterInputs, PlayerId } from '../../types';

export class InputManager {
  private activeKeys = new Set<string>();

  // Virtual touch controls for mobile
  private touchInputsP1: FighterInputs = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    crouch: false,
    punch: false,
    kick: false,
    block: false,
    punchLight: false,
    punchHeavy: false,
    kickLight: false,
    kickHeavy: false,
    special: false,
    charge: false,
    ultimate: false,
  };

  private touchInputsP2: FighterInputs = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    crouch: false,
    punch: false,
    kick: false,
    block: false,
    punchLight: false,
    punchHeavy: false,
    kickLight: false,
    kickHeavy: false,
    special: false,
    charge: false,
    ultimate: false,
  };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
    this.attach();
  }

  public attach(): void {
    window.addEventListener('keydown', this.boundKeyDown, { passive: false });
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
    window.addEventListener('focus', this.boundBlur);
  }

  public detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
    window.removeEventListener('focus', this.boundBlur);
    this.resetAll();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    const key = e.key;
    
    // Prevent default scroll/tab/focus behavior on fighting game control keys
    const preventCodes = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyR', 'KeyT', 'KeyE', 'KeyQ', 'KeyC', 'KeyV', 'KeyY',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketRight',
      'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'NumpadEnter',
      'Space', 'Tab'
    ];
    if (preventCodes.includes(code)) {
      e.preventDefault();
    }

    this.activeKeys.add(code);
    if (key) {
      this.activeKeys.add(key.toLowerCase());
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.activeKeys.delete(e.code);
    if (e.key) {
      this.activeKeys.delete(e.key.toLowerCase());
    }
  }

  private handleBlur(): void {
    // Release all pressed inputs immediately when browser window loses focus or regains focus
    this.resetAll();
  }

  public setTouchInput(player: PlayerId, input: keyof FighterInputs, active: boolean): void {
    if (player === 'P1') {
      this.touchInputsP1[input] = active;
    } else {
      this.touchInputsP2[input] = active;
    }
  }

  /**
   * Gamepad API Integration (Xbox, PlayStation, Generic USB Controllers)
   * Player 1 -> Gamepad 0
   * Player 2 -> Gamepad 1
   */
  private getGamepadInputs(player: PlayerId): Partial<FighterInputs> {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return {};
    }

    try {
      const gamepads = navigator.getGamepads();
      const padIndex = player === 'P1' ? 0 : 1;
      const gp = gamepads[padIndex];

      if (!gp || !gp.connected) {
        return {};
      }

      // Left Stick axes
      const axisX = gp.axes[0] ?? 0;
      const axisY = gp.axes[1] ?? 0;
      const deadzone = 0.28;

      const btn = (index: number) => {
        const b = gp.buttons[index];
        return !!b && (b.pressed || b.value > 0.4);
      };

      const dpadLeft = btn(14) || axisX < -deadzone;
      const dpadRight = btn(15) || axisX > deadzone;
      const dpadUp = btn(12) || axisY < -deadzone;
      const dpadDown = btn(13) || axisY > deadzone;

      // Standard fighting game button mapping
      const kickLight = btn(0);  // A / Cross
      const kickHeavy = btn(1);  // B / Circle
      const punchLight = btn(2); // X / Square
      const punchHeavy = btn(3); // Y / Triangle
      const block = btn(4);      // L1 / Left Bumper
      const special = btn(5);    // R1 / Right Bumper
      const charge = btn(6);     // L2 / Left Trigger
      const ultimate = btn(7);   // R2 / Right Trigger

      return {
        moveLeft: dpadLeft,
        moveRight: dpadRight,
        jump: dpadUp,
        crouch: dpadDown,
        punch: punchLight || punchHeavy,
        kick: kickLight || kickHeavy,
        block,
        punchLight,
        punchHeavy,
        kickLight,
        kickHeavy,
        special,
        charge,
        ultimate,
      };
    } catch (e) {
      return {};
    }
  }

  public getInputs(player: PlayerId): FighterInputs {
    const isP1 = player === 'P1';
    const touch = isP1 ? this.touchInputsP1 : this.touchInputsP2;
    const gp = this.getGamepadInputs(player);

    if (isP1) {
      // PLAYER 1 (Left hand / Left side of keyboard + Touch Controls + Gamepad 0)
      const punchLight = this.isAnyActive('KeyF', 'f') || !!touch.punchLight || !!gp.punchLight;
      const punchHeavy = this.isAnyActive('KeyR', 'r') || !!touch.punchHeavy || !!gp.punchHeavy;
      const kickLight = this.isAnyActive('KeyG', 'g') || !!touch.kickLight || !!gp.kickLight;
      const kickHeavy = this.isAnyActive('KeyT', 't') || !!touch.kickHeavy || !!gp.kickHeavy;
      const special = this.isAnyActive('Space', 'space', 'KeyE', 'e', 'KeyQ', 'q') || !!touch.special || !!gp.special;
      const charge = this.isAnyActive('KeyC', 'c') || !!touch.charge || !!gp.charge;
      const ultimate = this.isAnyActive('KeyV', 'v', 'KeyY', 'y') || !!touch.ultimate || !!gp.ultimate;
      const isRunning = this.isAnyActive('ShiftLeft');

      return {
        moveLeft: this.isAnyActive('KeyA', 'a') || touch.moveLeft || !!gp.moveLeft,
        moveRight: this.isAnyActive('KeyD', 'd') || touch.moveRight || !!gp.moveRight,
        jump: this.isAnyActive('KeyW', 'w') || touch.jump || !!gp.jump,
        crouch: this.isAnyActive('KeyS', 's') || touch.crouch || !!gp.crouch,
        punch: punchLight || punchHeavy || touch.punch || !!gp.punch,
        kick: kickLight || kickHeavy || touch.kick || !!gp.kick,
        block: this.isAnyActive('KeyH', 'h') || touch.block || !!gp.block,
        run: isRunning,
        punchLight,
        punchHeavy,
        kickLight,
        kickHeavy,
        special,
        charge,
        ultimate,
      };
    } else {
      // PLAYER 2 (Right hand: J, U, K, I, L, O or Numpad + Arrow keys + Gamepad 1)
      const punchLight = this.isAnyActive('KeyJ', 'j', 'Numpad4') || !!touch.punchLight || !!gp.punchLight;
      const punchHeavy = this.isAnyActive('KeyU', 'u', 'Numpad5') || !!touch.punchHeavy || !!gp.punchHeavy;
      const kickLight = this.isAnyActive('KeyK', 'k', 'Numpad1') || !!touch.kickLight || !!gp.kickLight;
      const kickHeavy = this.isAnyActive('KeyI', 'i', 'Numpad2') || !!touch.kickHeavy || !!gp.kickHeavy;
      const special = this.isAnyActive('KeyO', 'o', 'NumpadEnter', 'Numpad3') || !!touch.special || !!gp.special;
      const charge = this.isAnyActive('KeyP', 'p', 'Numpad7') || !!touch.charge || !!gp.charge;
      const ultimate = this.isAnyActive('BracketRight', 'Numpad8') || !!touch.ultimate || !!gp.ultimate;
      const isRunning = this.isAnyActive('ShiftRight');

      return {
        moveLeft: this.isAnyActive('ArrowLeft', 'arrowleft') || touch.moveLeft || !!gp.moveLeft,
        moveRight: this.isAnyActive('ArrowRight', 'arrowright') || touch.moveRight || !!gp.moveRight,
        jump: this.isAnyActive('ArrowUp', 'arrowup') || touch.jump || !!gp.jump,
        crouch: this.isAnyActive('ArrowDown', 'arrowdown') || touch.crouch || !!gp.crouch,
        punch: punchLight || punchHeavy || touch.punch || !!gp.punch,
        kick: kickLight || kickHeavy || touch.kick || !!gp.kick,
        block: this.isAnyActive('KeyL', 'l', 'Numpad0', 'Numpad6') || touch.block || !!gp.block,
        run: isRunning,
        punchLight,
        punchHeavy,
        kickLight,
        kickHeavy,
        special,
        charge,
        ultimate,
      };
    }
  }

  private isAnyActive(...keys: string[]): boolean {
    return keys.some((k) => this.activeKeys.has(k));
  }

  public resetAll(): void {
    this.activeKeys.clear();
    Object.keys(this.touchInputsP1).forEach((k) => {
      this.touchInputsP1[k as keyof FighterInputs] = false;
      this.touchInputsP2[k as keyof FighterInputs] = false;
    });
  }
}
