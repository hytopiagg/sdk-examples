import { Collider, ColliderShape, Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';

export default class TrainingSwordItem extends BaseWeaponItem {
  // Required static properties
  static readonly id = 'toy_sword';
  static readonly name = 'Training Sword';
  static readonly iconImageUri = 'icons/items/wooden-sword.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: ['sword-attack-upper', 'sword-attack-1'],
    cooldownMs: 500,
    damage: 3,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 5,
    reach: 2,
  };
  
  // Optional static properties (overriding defaults)
  static readonly specialAttack: BaseWeaponItemAttack = {
    id: 'spin',
    animations: ['sword-attack-tornado'],
    cooldownMs: 2500,
    damage: 8,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 9,
    reach: 1.5,
  };
  static readonly description = 'A training sword made from wood. Useless for combat.';
  static readonly heldModelUri = 'models/items/sword-wooden.gltf';
  static readonly heldModelScale = 0.5;
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 90);
  static readonly defaultRelativePositionAsChild = { x: 0, y: 0.1, z: 0.15 };
  static readonly buyPrice = 5;
  static readonly sellPrice = 1;

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
