import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

// Drops
import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyesItem.ts";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";
import RawHideItem from "../../items/materials/RawHideItem.ts";

export type RatkinBruteEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class RatkinBruteEntity extends BaseCombatEntity {
  constructor(options?: RatkinBruteEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy body slam attack
          animations: [ 'atk1' ],
          cooldownMs: 4000,
          range: 1.5,
          simpleAttackDamage: 20,
          simpleAttackDamageVariance: 0.6, // ±60% damage (12-28)
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light hammer swing attack
          animations: [ 'atk2' ],
          cooldownMs: 1500,
          range: 1.5,
          simpleAttackDamage: 16,
          simpleAttackDamageVariance: 0.15, // ±15% damage (7-11)
          simpleAttackDamageDelayMs: 500, // Deal damage 500ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
        { // Light hammer swing 2 attack
          animations: [ 'atk3' ],
          cooldownMs: 1500,
          range: 1.5,
          simpleAttackDamage: 13,
          simpleAttackDamageVariance: 0.15, // ±15% damage (5-9)
          simpleAttackDamageDelayMs: 350, // Deal damage 350ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 25,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        { itemClass: RatkinBonesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinEyesItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinToothItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: RatkinTailItem, minQuantity: 1, maxQuantity: 3, weight: 4 },
        { itemClass: GoldItem, minQuantity: 6, maxQuantity: 15, weight: 2 },
        { itemClass: RawHideItem, minQuantity: 1, maxQuantity: 2, weight: 1 },
        { itemClass: CommonMushroomItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
        { itemClass: CommonSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      health: 70,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-brute.gltf',
      modelScale: 0.6,
      moveAnimations: [ 'walk' ],
      moveSpeed: 2.5,
      name: 'Ratkin Brute',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      ...options,
    });
  }
}