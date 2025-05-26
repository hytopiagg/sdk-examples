import { Quaternion } from 'hytopia';
import type { PlayerEntity, QuaternionLike, Vector3Like } from 'hytopia';

import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

export default class ShotgunEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({
      ammo: options.ammo ?? 3,
      damage: options.damage ?? 4, // damage per pellet
      fireRate: options.fireRate ?? 1.3,
      hand: options.hand ?? 'right',
      iconImageUri: options.iconImageUri ?? 'icons/shotgun.png',
      idleAnimation: options.idleAnimation ?? 'idle_gun_both',
      name: options.name ?? 'Shotgun',
      maxAmmo: options.maxAmmo ?? 3,
      modelUri: options.modelUri ?? 'models/items/shotgun.glb',
      modelScale: options.modelScale ?? 1.2,
      parent: options.parent,
      range: options.range ?? 8,
      reloadAudioUri: options.reloadAudioUri ?? 'audio/sfx/shotgun-reload.mp3',
      reloadTimeMs: options.reloadTimeMs ?? 1000,
      shootAudioUri: options.shootAudioUri ?? 'audio/sfx/shotgun-shoot.mp3',
      shootAnimation: options.shootAnimation ?? 'shoot_gun_both',
    });
  }

  public override shoot() {
    if (!this.parent || !this.processShoot()) {
      return;
    }

    const parentPlayerEntity = this.parent as PlayerEntity;

    if (!parentPlayerEntity.world) {
      return;
    }

    // shoot the bullet
    super.shoot();

    // cancel the input, pistols require click to shoot
    parentPlayerEntity.player.input.ml = false;
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.03, y: 0.1, z: -1.5 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }

  public override shootRaycast(origin: Vector3Like, direction: Vector3Like, length: number) {
    // Create spread pattern for shotgun pellets using angles relative to direction
    const spreadAngles = [
      { x: 0, y: 0 },      // Center
      { x: 0.035, y: 0.035 },  // Upper right
      { x: -0.035, y: 0.035 }, // Upper left
      { x: 0.05, y: 0 },   // Right
      { x: -0.05, y: 0 },  // Left
      { x: 0.035, y: -0.035 }, // Lower right
      { x: -0.035, y: -0.035 } // Lower left
    ];

    // Fire each pellet with spread applied to original direction
    for (const angle of spreadAngles) {
      // Calculate spread direction relative to original direction
      const spreadDirection = {
        x: direction.x + (direction.z * angle.x), // Add horizontal spread
        y: direction.y + angle.y,                 // Add vertical spread
        z: direction.z - (direction.x * angle.x)  // Maintain direction magnitude
      };

      // Normalize the spread direction to maintain consistent range
      const magnitude = Math.sqrt(
        spreadDirection.x * spreadDirection.x + 
        spreadDirection.y * spreadDirection.y + 
        spreadDirection.z * spreadDirection.z
      );

      const normalizedDirection = {
        x: spreadDirection.x / magnitude,
        y: spreadDirection.y / magnitude,
        z: spreadDirection.z / magnitude
      };

      super.shootRaycast(origin, normalizedDirection, length);
    }
  }
}

