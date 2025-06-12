import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from "../BaseProjectileEntity";
import GoldItem from "../../items/general/GoldItem";
import WoodenSwordItem from "../../items/weapons/WoodenSwordItem";
import type { Vector3Like } from 'hytopia';

export type RatkinSpellcasterEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinSpellcasterEntity extends BaseCombatEntity {
  constructor(options?: RatkinSpellcasterEntityOptions) {
    super({
      aggroRadius: 12,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Fireball attack
          animations: [ 'atk1' ],
          complexAttack: (params) => {
            this._shootFireball(params.target.position, this.calculateDamageWithVariance(30, 0.5));
          },
          complexAttackDelayMs: 1000,
          cooldownMs: 5000,
          range: 10,
          weight: 2,
        },
      ],
      combatExperienceReward: 250,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        {
          item: new GoldItem(),
          minQuantity: 50,
          maxQuantity: 70,
          weight: 1
        },
        {
          item: new WoodenSwordItem(),
          weight: 0.1,
        },
      ],
      health: 100,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-spellcaster.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Ratkin Spellcaster',
      ...options,
    });
  }

  private _shootFireball(targetPosition: Vector3Like, damage: number) {
    if (!this.world) return;

    const fireball = new BaseProjectileEntity({
      damage,
      despawnAfterMs: 2000,
      direction: this.calculateDirectionToTargetPosition(targetPosition),
      gravityScale: 0,
      modelUri: 'models/projectiles/fireball.glb',
      speed: 15,
      source: this,
    });
    
    fireball.spawn(this.world, this.position, this.rotation);
  }
}