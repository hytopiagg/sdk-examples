import { Quaternion } from 'hytopia';
import PistolEntity from './PistolEntity';
import type { GunEntityOptions } from '../GunEntity';
import type { PlayerEntity, QuaternionLike, Vector3Like } from 'hytopia';

// fire behavior is very similar to a pistol, so we inherit from it.
export default class AR15Entity extends PistolEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({
      ammo: options.ammo ?? 30,
      damage: options.damage ?? 4,
      fireRate: options.fireRate ?? 15,
      iconImageUri: options.iconImageUri ?? 'icons/ar-15.png',
      idleAnimation: options.idleAnimation ?? 'idle_gun_both',
      name: options.name ?? 'AR-15',
      maxAmmo: options.maxAmmo ?? 30,
      modelUri: options.modelUri ?? 'models/items/ar-15.glb',
      reloadAudioUri: options.reloadAudioUri ?? 'audio/sfx/rifle-reload.mp3',
      reloadTimeMs: options.reloadTimeMs ?? 1500,
      shootAnimation: options.shootAnimation ?? 'shoot_gun_both',
      shootAudioUri: options.shootAudioUri ?? 'audio/sfx/rifle-shoot.mp3',
      ...options,
    });
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.01, y: 0.03, z: -1.42 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}