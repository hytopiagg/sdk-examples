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
import RawHideItem from "../../items/materials/RawHideItem.ts";

export type TaintedRatkinRangerEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class TaintedRatkinRangerEntity extends BaseCombatEntity {
  constructor(options?: TaintedRatkinRangerEntityOptions) {
    super({
      aggroRadius: 11,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Fast bow attack
          animations: [ 'atk1' ],
          complexAttack: (params) => {
            this._shootArrow(params.target.position, this.calculateDamageWithVariance(15, 0.5));
          },
          complexAttackDelayMs: 700,
          cooldownMs: 1500,
          range: 10,
          weight: 2,
        },
        { // Slow heavy bow attack
          animations: [ 'atk2' ],
          complexAttack: (params) => {
            this._shootArrow(params.target.position, this.calculateDamageWithVariance(30, 0.5));
          },
          complexAttackDelayMs: 1600,
          cooldownMs: 2500,
          range: 10,
          weight: 3,
        },
      ],
      combatExperienceReward: 30,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        { itemClass: RatkinBonesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinEyesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinToothItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinTailItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: GoldItem, minQuantity: 9, maxQuantity: 17, weight: 2 },
        { itemClass: RawHideItem, minQuantity: 2, maxQuantity: 3, weight: 1 },
        { itemClass: CommonMushroomItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
        { itemClass: CommonSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      health: 150,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-ranger.gltf',
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 4,
      name: 'Tainted Ratkin Ranger',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      tintColor: { r: 128, g: 255, b: 128 },
      ...options,
    });
  }

  private _shootArrow(targetPosition: Vector3Like, damage: number) {
    if (!this.world) return;
    
    const arrow = new BaseProjectileEntity({
      damage,
      despawnAfterMs: 1000,
      direction: this.calculateDirectionToTargetPosition(targetPosition),
      gravityScale: 0.1,
      modelUri: 'models/projectiles/arrow.glb',
      modelScale: 0.75,
      speed: 30,
      source: this,
    });
    
    arrow.spawn(this.world, this.position, this.rotation);
  }
}