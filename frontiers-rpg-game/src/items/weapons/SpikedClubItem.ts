import { Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';

export default class SpikedClubItem extends BaseWeaponItem {
  // Required static properties
  static readonly id = 'spiked_club';
  static readonly name = 'Spiked Club';
  static readonly iconImageUri = 'icons/items/spiked-club.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: ['sword-attack-upper'],
    cooldownMs: 1500,
    damage: 34,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 8,
    reach: 1.75,
  };
  
  static readonly description = `A spiked club. It's bulky and slow to swing but packs a punch.`;
  static readonly heldModelUri = 'models/weapons/spiked-club.gltf';
  static readonly heldModelScale = 0.6;
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 90);
  static readonly defaultRelativePositionAsChild = { x: 0.3, y: -0.2, z: -0.17 };
  static readonly buyPrice = 750;
  static readonly sellPrice = 75;
}
