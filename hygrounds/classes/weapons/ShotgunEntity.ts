import { Quaternion, Vector3Like, QuaternionLike } from 'hytopia';
import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

const DEFAULT_SHOTGUN_OPTIONS: GunEntityOptions = {
  ammo: 4,
  damage: 13,
  fireRate: 1.3,
  heldHand: 'both',
  iconImageUri: 'icons/shotgun.png',
  idleAnimation: 'idle_gun_both',
  mlAnimation: 'shoot_gun_both',
  name: 'Shotgun',
  maxAmmo: 4,
  totalAmmo: 24,
  modelUri: 'models/items/shotgun.glb',
  modelScale: 1.2,
  range: 8,
  reloadAudioUri: 'audio/sfx/shotgun-reload.mp3',
  reloadTimeMs: 3000,
  shootAudioUri: 'audio/sfx/shotgun-shoot.mp3',
};

export default class ShotgunEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_SHOTGUN_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
    
    // Cancel input since shotgun requires click-to-shoot
    // (this.parent as GamePlayerEntity).player.input.ml = false;
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

