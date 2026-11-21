// src/game/physics/PhysicsWorld.ts
import RAPIER from '@dimforge/rapier3d-compat';
import { GAME_CONFIG } from '../../config/gameConfig';

export class PhysicsWorld {
  private world: RAPIER.World | null = null;
  private isInitialized = false;
  private groundCollider: RAPIER.Collider | null = null;
  private leftWallCollider: RAPIER.Collider | null = null;
  private rightWallCollider: RAPIER.Collider | null = null;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await RAPIER.init();
      const gravity = new RAPIER.Vector3(0.0, GAME_CONFIG.PHYSICS.GRAVITY, 0.0);
      this.world = new RAPIER.World(gravity);

      // Create static Arena Floor collider
      const groundBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0);
      const groundBody = this.world.createRigidBody(groundBodyDesc);
      const groundColliderDesc = RAPIER.ColliderDesc.cuboid(30, 0.5, 15);
      this.groundCollider = this.world.createCollider(groundColliderDesc, groundBody);

      // Create Arena Left Boundary Wall
      const leftWallBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
        GAME_CONFIG.ARENA.WALL_LIMIT_LEFT - 0.5,
        5,
        0
      );
      const leftWallBody = this.world.createRigidBody(leftWallBodyDesc);
      const leftWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 6, 10);
      this.leftWallCollider = this.world.createCollider(leftWallColliderDesc, leftWallBody);

      // Create Arena Right Boundary Wall
      const rightWallBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
        GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT + 0.5,
        5,
        0
      );
      const rightWallBody = this.world.createRigidBody(rightWallBodyDesc);
      const rightWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 6, 10);
      this.rightWallCollider = this.world.createCollider(rightWallColliderDesc, rightWallBody);

      this.isInitialized = true;
      console.log('Rapier 3D Physics initialized successfully');
    } catch (err) {
      console.warn('Rapier 3D failed to initialize, falling back to deterministic math physics:', err);
      this.isInitialized = false;
    }
  }

  public step(deltaTime: number): void {
    if (!this.world) return;
    // Rapier fixed timestep clamp
    this.world.timestep = Math.min(deltaTime, 1 / 30);
    this.world.step();
  }

  public createCharacterCapsule(x: number, y: number): {
    body: RAPIER.RigidBody | null;
    collider: RAPIER.Collider | null;
  } {
    if (!this.world) return { body: null, collider: null };

    const halfHeight = (GAME_CONFIG.PHYSICS.CHARACTER_HEIGHT - 2 * GAME_CONFIG.PHYSICS.CHARACTER_RADIUS) / 2;
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y + halfHeight + GAME_CONFIG.PHYSICS.CHARACTER_RADIUS, 0);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, GAME_CONFIG.PHYSICS.CHARACTER_RADIUS);
    const collider = this.world.createCollider(colliderDesc, body);

    return { body, collider };
  }

  public raycastGround(originX: number, originY: number): boolean {
    if (!this.world) {
      // Deterministic fallback
      return originY <= GAME_CONFIG.ARENA.FLOOR_Y + 0.05;
    }
    const ray = new RAPIER.Ray(
      new RAPIER.Vector3(originX, originY + 0.2, 0),
      new RAPIER.Vector3(0, -1, 0)
    );
    const hit = this.world.castRay(ray, 0.35, true);
    return hit !== null;
  }

  public dispose(): void {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.isInitialized = false;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}
