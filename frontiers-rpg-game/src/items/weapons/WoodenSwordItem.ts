import { Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemOptions } from '../BaseWeaponItem';

export default class WoodenSwordItem extends BaseWeaponItem {
  public constructor(options?: Partial<BaseWeaponItemOptions>) {
    super({
      attack: {
        animations: [ 'sword-attack-upper' ],
        cooldownMs: 500,
        damage: 10,
        damageDelayMs: 200,
        knockbackForce: 5,
        reach: 2,
      },
      defaultRelativeRotationAsChild: Quaternion.fromEuler(-90, 0, 90),
      defaultRelativePositionAsChild: { x: 0, y: 0.1, z: 0.15 },
      iconImageUri: 'icons/items/wooden-sword.png',
      heldModelUri: 'models/items/sword-wooden.gltf',
      heldModelScale: 0.5,
      name: 'Wooden Sword',
      description: '[f44336]+10 damage[/][b]A basic wooden sword.',
      ...options,
    });
  }
}
