import { Collider, ColliderShape, Quaternion } from 'hytopia';
import BaseWeaponItem, { BaseWeaponItemAttack } from '../BaseWeaponItem';

export default class ChieftanBladeItem extends BaseWeaponItem {
  static readonly id = 'chieftan_blade';
  static readonly name = 'Chieftan Blade';
  static readonly iconImageUri = 'icons/items/chieftan-blade.png';
  static readonly attack: BaseWeaponItemAttack = {
    animations: ['sword-attack-upper', 'sword-attack-1'],
    cooldownMs: 500,
    damage: 35,
    damageDelayMs: 200,
    damageVariance: 0.25,
    knockbackForce: 5,
    reach: 2.5,
  };
  
  static readonly specialAttack: BaseWeaponItemAttack = {
    id: 'spin',
    animations: ['sword-attack-tornado'],
    cooldownMs: 2500,
    damage: 43,
    damageDelayMs: 200,
    damageVariance: 0.2,
    knockbackForce: 9,
    reach: 2,
  };
  static readonly description = `A pointed blade from a Gorkin Chieftan. It's almost too big to wield.`;
  static readonly heldModelUri = 'models/weapons/chieftan-blade.gltf';
  static readonly heldModelScale = 0.5;
  static readonly rarity = 'rare';
  static readonly defaultRelativeRotationAsChild = Quaternion.fromEuler(-90, 0, 0);
  static readonly defaultRelativePositionAsChild = { x: 0, y: 0.1, z: 0 };
  static readonly buyPrice = 1200;
  static readonly sellPrice = 120;

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
