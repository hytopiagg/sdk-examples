import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from "../BaseProjectileEntity";
import type { Vector3Like } from 'hytopia';

// Drops
import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyesItem.ts";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";

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
      combatExperienceReward: 20,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        {
          itemClass: GoldItem,
          minQuantity: 30,
          maxQuantity: 70,
          weight: 2,
        },
        {
          itemClass: CommonMushroomItem,
          minQuantity: 1,
          maxQuantity: 3,
          weight: 1,
        },
        {
          itemClass: CommonSeedsItem,
          weight: 0.5,
        },
        {
          itemClass: RatkinBonesItem,
          weight: 0.8,
        },
        {
          itemClass: RatkinEyesItem,
          weight: 0.8,
        },
        {
          itemClass: RatkinToothItem,
          weight: 0.8,
        },
        {
          itemClass: RatkinTailItem,
          weight: 0.8,
        },
      ],
      health: 100,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-spellcaster.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Ratkin Spellcaster',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
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