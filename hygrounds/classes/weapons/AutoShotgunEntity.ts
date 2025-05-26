import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

const DEFAULT_AUTO_SHOTGUN_OPTIONS: GunEntityOptions = {
  ammo: 6,
  damage: 11,
  fireRate: 1.5,
  heldHand: 'both',
  iconImageUri: 'icons/auto-shotgun.png',
  idleAnimation: 'idle_gun_both',
  mlAnimation: 'shoot_gun_both',
  name: 'Auto Shotgun',
  maxAmmo: 6,
  totalAmmo: 30,
  modelUri: 'models/items/auto-shotgun.glb',
  modelScale: 1.2,
  range: 10,
  reloadAudioUri: 'audio/sfx/shotgun-reload.mp3',
  reloadTimeMs: 3500,
  shootAudioUri: 'audio/sfx/shotgun-shoot.mp3',
};

export default class AutoShotgunEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_AUTO_SHOTGUN_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.015, y: 0, z: -1 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }

  public override shootRaycast(origin: Vector3Like, direction: Vector3Like, length: number) {
    // Create spread pattern for auto-shotgun pellets using angles relative to direction
    const spreadAngles = [
      { x: 0, y: 0 },      // Center
      { x: 0.05, y: 0.05 },  // Upper right
      { x: -0.05, y: 0.05 }, // Upper left
      { x: 0.07, y: 0 },   // Right
      { x: -0.07, y: 0 },  // Left
      { x: 0.05, y: -0.05 }, // Lower right
      { x: -0.05, y: -0.05 } // Lower left
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

