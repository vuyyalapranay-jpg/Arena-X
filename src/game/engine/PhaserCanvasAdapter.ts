// src/game/engine/PhaserCanvasAdapter.ts
// PHASER 3 CANVAS-EXPLICIT 2D ADAPTER & LIFECYCLE CONTROLLER

import Phaser from 'phaser';

export class PhaserCanvasAdapter {
  private game: Phaser.Game | null = null;

  /**
   * Generates a verified Phaser 3 configuration strictly utilizing HTML5 Canvas 2D.
   * Explicitly sets type: Phaser.CANVAS to prohibit WebGL.
   */
  public static createConfig(
    parent: HTMLElement,
    width: number,
    height: number,
    scenes: Phaser.Types.Scenes.SceneType[]
  ): Phaser.Types.Core.GameConfig {
    return {
      type: Phaser.CANVAS, // STRICTLY 2D CANVAS — PROHIBITED: WebGL
      parent,
      width,
      height,
      transparent: false,
      backgroundColor: '#040714',
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // Combat engine uses deterministic custom 2D physics
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      scene: scenes,
    };
  }

  public init(config: Phaser.Types.Core.GameConfig): Phaser.Game {
    if (this.game) {
      this.game.destroy(true);
    }
    this.game = new Phaser.Game(config);
    return this.game;
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
