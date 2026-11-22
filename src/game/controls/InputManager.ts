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
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyR', 'KeyT', 'KeyE', 'KeyQ',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI', 'KeyO',
      'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'NumpadEnter',
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

  public getInputs(player: PlayerId): FighterInputs {
    const isP1 = player === 'P1';
    const touch = isP1 ? this.touchInputsP1 : this.touchInputsP2;

    if (isP1) {
      // PLAYER 1 (Left hand / Left side of keyboard + Touch Controls)
      const punchLight = this.isAnyActive('KeyF', 'f') || !!touch.punchLight;
      const punchHeavy = this.isAnyActive('KeyR', 'r') || !!touch.punchHeavy;
      const kickLight = this.isAnyActive('KeyG', 'g') || !!touch.kickLight;
      const kickHeavy = this.isAnyActive('KeyT', 't') || !!touch.kickHeavy;
      const special = this.isAnyActive('Space', 'space', 'KeyE', 'e', 'KeyQ', 'q') || !!touch.special;
      const isRunning = this.isAnyActive('ShiftLeft');

      return {
        moveLeft: this.isAnyActive('KeyA', 'a') || touch.moveLeft,
        moveRight: this.isAnyActive('KeyD', 'd') || touch.moveRight,
        jump: this.isAnyActive('KeyW', 'w') || touch.jump,
        crouch: this.isAnyActive('KeyS', 's') || touch.crouch,
        punch: punchLight || punchHeavy || touch.punch,
        kick: kickLight || kickHeavy || touch.kick,
        block: this.isAnyActive('KeyH', 'h') || touch.block,
        run: isRunning,
        punchLight,
        punchHeavy,
        kickLight,
        kickHeavy,
        special,
      };
    } else {
      // PLAYER 2 (Right hand: J, U, K, I, L, O or Numpad + Arrow keys)
      const punchLight = this.isAnyActive('KeyJ', 'j', 'Numpad4') || !!touch.punchLight;
      const punchHeavy = this.isAnyActive('KeyU', 'u', 'Numpad5') || !!touch.punchHeavy;
      const kickLight = this.isAnyActive('KeyK', 'k', 'Numpad1') || !!touch.kickLight;
      const kickHeavy = this.isAnyActive('KeyI', 'i', 'Numpad2') || !!touch.kickHeavy;
      const special = this.isAnyActive('KeyO', 'o', 'NumpadEnter', 'Numpad3') || !!touch.special;
      const isRunning = this.isAnyActive('ShiftRight');

      return {
        moveLeft: this.isAnyActive('ArrowLeft', 'arrowleft') || touch.moveLeft,
        moveRight: this.isAnyActive('ArrowRight', 'arrowright') || touch.moveRight,
        jump: this.isAnyActive('ArrowUp', 'arrowup') || touch.jump,
        crouch: this.isAnyActive('ArrowDown', 'arrowdown') || touch.crouch,
        punch: punchLight || punchHeavy || touch.punch,
        kick: kickLight || kickHeavy || touch.kick,
        block: this.isAnyActive('KeyL', 'l', 'Numpad0', 'Numpad6') || touch.block,
        run: isRunning,
        punchLight,
        punchHeavy,
        kickLight,
        kickHeavy,
        special,
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
