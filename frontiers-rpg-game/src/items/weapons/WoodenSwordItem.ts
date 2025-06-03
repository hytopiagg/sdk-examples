import { Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemOptions } from '../BaseWeaponItem';

export default class WoodenSwordItem extends BaseWeaponItem {
  public constructor(options?: BaseWeaponItemOptions) {
    super({
      attackAnimations: [ 'sword-attack-upper' ],
      attackCooldownMs: 500,
      attackDamage: 10,
      attackDamageDelayMs: 200,
      attackKnockbackForce: 5,
      attackDamageVariance: 0.1,
      attackReach: 2,
      defaultRelativeRotationAsChild: Quaternion.fromEuler(-90, 0, 90),
      defaultRelativePositionAsChild: { x: 0, y: 0.1, z: 0.15 },
      iconImageUri: 'icons/items/wooden-sword.png',
      modelUri: 'models/items/sword-wooden.gltf',
      modelScale: 0.5,
      name: 'Wooden Sword',
      ...options,
    });
  }
}
