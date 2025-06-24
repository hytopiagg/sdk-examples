import { Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';

export default class IronDaggerItem extends BaseWeaponItem {
  // Required static properties
  static readonly id = 'iron_dagger';
  static readonly name = 'Iron Dagger';
  static readonly iconImageUri = 'icons/items/iron-dagger.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: [ 'sword-attack-upper', 'sword-attack-5'],
    cooldownMs: 300,
    damage: 9,
    damageDelayMs: 50,
    damageVariance: 0.4,
    knockbackForce: 3,
    reach: 1.5,
  };
  
  static readonly description = `A sharp iron dagger. It doesn't have much reach, but it's good for quick strikes.`;
  static readonly heldModelUri = 'models/weapons/iron-dagger.gltf';
  static readonly heldModelScale = 0.5;
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 90);
  static readonly defaultRelativePositionAsChild = { x: 0.25, y: -0.1, z: -0.25 };
  static readonly buyPrice = 450;
  static readonly sellPrice = 45;
}
