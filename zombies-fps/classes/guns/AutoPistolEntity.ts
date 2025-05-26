import { Quaternion } from 'hytopia';
import PistolEntity from './PistolEntity';
import type { GunEntityOptions } from '../GunEntity';
import type { PlayerEntity, QuaternionLike, Vector3Like } from 'hytopia';

export default class AutoPistolEntity extends PistolEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({
      ammo: options.ammo ?? 20,
      fireRate: options.fireRate ?? 7,
      iconImageUri: options.iconImageUri ?? 'icons/auto-pistol.png',
      name: options.name ?? 'Auto Pistol',
      maxAmmo: options.maxAmmo ?? 20,
      modelUri: options.modelUri ?? 'models/items/auto-pistol.glb',
      ...options,
    });
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.01, y: 0.1, z: -0.35 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }

  public override shoot() {
    if (!this.parent) {
      return;
    }

    super.shoot();

    const parentPlayerEntity = this.parent as PlayerEntity;
    parentPlayerEntity.player.input.ml = true; // prevent cancel for auto fire.
  }
}