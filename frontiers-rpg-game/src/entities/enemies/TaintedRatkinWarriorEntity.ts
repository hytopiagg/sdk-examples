import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

// Drops
import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyesItem.ts";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";

export type TaintedRatkinWarriorEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class TaintedRatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: TaintedRatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy attack
          animations: [ 'atk1' ],
          cooldownMs: 3500,
          range: 2,
          simpleAttackDamage: 35,
          simpleAttackDamageVariance: 0.4, // ±40% damage (15-35)
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light attack
          animations: [ 'atk2' ],
          cooldownMs: 1500,
          range: 2,
          simpleAttackDamage: 15,
          simpleAttackDamageVariance: 0.1, // ±10% damage (9-11) 
          simpleAttackDamageDelayMs: 400, // Deal damage 400ms into animation
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
        { itemClass: GoldItem, minQuantity: 9, maxQuantity: 17, weight: 2 },
        { itemClass: CommonMushroomItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
        { itemClass: CommonSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      health: 150,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-warrior.gltf',
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 4,
      name: 'Tainted Ratkin Warrior',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      tintColor: { r: 128, g: 255, b: 128 },
      ...options,
    });
  }
}