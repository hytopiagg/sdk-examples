import { Quaternion } from 'hytopia';
import ShotgunEntity from './ShotgunEntity';
import type { GunEntityOptions } from '../GunEntity';
import type { PlayerEntity, QuaternionLike, Vector3Like } from 'hytopia';

export default class AutoShotgunEntity extends ShotgunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({
      ammo: options.ammo ?? 6,
      fireRate: options.fireRate ?? 2,
      iconImageUri: options.iconImageUri ?? 'icons/auto-shotgun.png',
      name: options.name ?? 'Auto Shotgun',
      maxAmmo: options.maxAmmo ?? 4,
      modelUri: options.modelUri ?? 'models/items/auto-shotgun.glb',
      reloadTimeMs: options.reloadTimeMs ?? 2500,
      ...options,
    });
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.015, y: 0, z: -1 },
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