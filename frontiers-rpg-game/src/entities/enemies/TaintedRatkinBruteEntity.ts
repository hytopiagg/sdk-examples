import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

// Drops
import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyesItem.ts";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";

export type TaintedRatkinBruteEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class TaintedRatkinBruteEntity extends BaseCombatEntity {
  constructor(options?: TaintedRatkinBruteEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy body slam attack
          animations: [ 'atk1' ],
          cooldownMs: 3500,
          range: 2,
          simpleAttackDamage: 30,
          simpleAttackDamageVariance: 0.6, // ±60% damage
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light hammer swing attack
          animations: [ 'atk2' ],
          cooldownMs: 1000,
          range: 2,
          simpleAttackDamage: 18,
          simpleAttackDamageVariance: 0.15, // ±15% damage
          simpleAttackDamageDelayMs: 500, // Deal damage 500ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
        { // Light hammer swing 2 attack
          animations: [ 'atk3' ],
          cooldownMs: 1000,
          range: 2,
          simpleAttackDamage: 13,
          simpleAttackDamageVariance: 0.15, // ±15% damage
          simpleAttackDamageDelayMs: 350, // Deal damage 350ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 45,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        { itemClass: RatkinBonesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinEyesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinToothItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinTailItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: GoldItem, minQuantity: 11, maxQuantity: 20, weight: 2 },
        { itemClass: CommonMushroomItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
        { itemClass: CommonSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      health: 210,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-brute.gltf',
      modelScale: 0.675,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3.325,
      name: 'Tainted Ratkin Brute',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      tintColor: { r: 128, g: 255, b: 128 },
      ...options,
    });
  }
}