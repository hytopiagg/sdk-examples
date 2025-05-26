import { Quaternion } from 'hytopia';
import type { PlayerEntity, Vector3Like, QuaternionLike } from 'hytopia';

import GunEntity from '../GunEntity';
import type { GunEntityOptions } from '../GunEntity';

export default class PistolEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({
      ammo: options.ammo ?? 10,
      damage: options.damage ?? 3,
      fireRate: options.fireRate ?? 9,
      hand: options.hand ?? 'right',
      iconImageUri: options.iconImageUri ?? 'icons/pistol.png',
      idleAnimation: options.idleAnimation ?? 'idle_gun_right',
      name: options.name ?? 'Pistol',
      maxAmmo: options.maxAmmo ?? 10,
      modelUri: options.modelUri ?? 'models/items/pistol.glb',
      modelScale: options.modelScale ?? 1.3,
      parent: options.parent,
      range: options.range ?? 50,
      reloadAudioUri: options.reloadAudioUri ?? 'audio/sfx/pistol-reload.mp3',
      reloadTimeMs: options.reloadTimeMs ?? 1250,
      shootAnimation: options.shootAnimation ?? 'shoot_gun_right',
      shootAudioUri: options.shootAudioUri ?? 'audio/sfx/pistol-shoot.mp3',
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

    // play shoot animation
    parentPlayerEntity.startModelOneshotAnimations([ 'shoot_gun_right' ]);
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.03, y: 0.1, z: -0.5 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }
}

