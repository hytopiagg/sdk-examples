import { Collider, ColliderShape, Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';

export default class IronLongSwordItem extends BaseWeaponItem {
  // Required static properties
  static readonly id = 'iron_long_sword';
  static readonly name = 'Iron Long Sword';
  static readonly iconImageUri = 'icons/items/iron-long-sword.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: ['sword-attack-upper', 'sword-attack-1'],
    cooldownMs: 750,
    damage: 18,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 5,
    reach: 2.5,
  };
  
  // Optional static properties (overriding defaults)
  static readonly specialAttack: BaseWeaponItemAttack = {
    id: 'spin',
    animations: ['sword-attack-tornado'],
    cooldownMs: 2500,
    damage: 28,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 9,
    reach: 2,
  };
  static readonly description = `A long iron sword. It's heavy and slow, but hits harder than a normal sword.`;
  static readonly heldModelUri = 'models/weapons/iron-long-sword.gltf';
  static readonly heldModelScale = 0.5;
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 90);
  static readonly defaultRelativePositionAsChild = { x: 0.25, y: -0.1, z: -0.1 };
  static readonly buyPrice = 600;
  static readonly sellPrice = 60;

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
      );

      for (const target of targets) {
        const targetDirection = target.directionFromRotation;
        this.dealDamage(
          target,
          this.calculateDamageWithVariance(attack.damage, attack.damageVariance),
          {
            x: -targetDirection.x,
            y: targetDirection.y,
            z: -targetDirection.z,
          },
          attack.knockbackForce
        );
      }
    } else {
      super.processAttackDamageTargets(attack);
    }
  }
}
