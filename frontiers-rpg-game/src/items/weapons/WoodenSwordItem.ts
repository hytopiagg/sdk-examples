import { Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemOptions } from '../BaseWeaponItem';

export default class WoodenSwordItem extends BaseWeaponItem {
  public constructor(options?: BaseWeaponItemOptions) {
    super({
      defaultRelativeRotationAsChild: Quaternion.fromEuler(-90, 0, 90),
      defaultRelativePositionAsChild: { x: 0, y: 0.1, z: 0.15 },
      iconImageUri: 'images/items/wooden_sword.png',
      modelUri: 'models/items/sword-wooden.gltf',
      modelScale: 0.5,
      name: 'Wooden Sword',
      ...options,
    });
  }
}
