import { Collider, ColliderShape, Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';
import { Vector3Like } from 'hytopia';

export default class WoodenSwordItem extends BaseWeaponItem {
  // Required static properties
  static readonly id = 'wooden_sword';
  static readonly name = 'Wooden Sword';
  static readonly iconImageUri = 'icons/items/wooden-sword.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: ['sword-attack-upper'],
    cooldownMs: 500,
    damage: 10,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 5,
    reach: 2,
  };
  
  // Optional static properties (overriding defaults)
  static readonly specialAttack: BaseWeaponItemAttack = {
    id: 'spin',
    animations: ['sword-attack-2'],
    cooldownMs: 1500,
    damage: 15,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 7,
    reach: 3,
  };
  static readonly description = '[f44336]+10 damage[/][b]A basic wooden sword.';
  static readonly heldModelUri = 'models/items/sword-wooden.gltf';
  static readonly heldModelScale = 0.5;
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 90);
  static readonly defaultRelativePositionAsChild = { x: 0, y: 0.1, z: 0.15 };

  protected override processAttackDamageTargets(attack: BaseWeaponItemAttack): void {
    if (!this.entity?.parent) return;

    if (attack.id === 'spin') {
      const spinCollider = new Collider({
        shape: ColliderShape.CYLINDER,
        halfHeight: 0.75,
        radius: attack.reach,
      })
  
      const targets = this.getTargetsByRawShapeIntersection(
        spinCollider.rawShape,
        this.entity.parent.position,
        this.entity.parent.rotation,
        attack.reach,
      );

      for (const target of targets) {
        this.dealDamage(
          target,
          this.calculateDamageWithVariance(attack.damage, attack.damageVariance),
          {
            x: -target.directionFromRotation.x,
            y: target.directionFromRotation.y,
            z: -target.directionFromRotation.z,
          },
          attack.knockbackForce
        );
      }
    } else {
      super.processAttackDamageTargets(attack);
    }
  }
}
