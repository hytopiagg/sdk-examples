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

export type RatkinWarriorEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class RatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy attack
          animations: [ 'atk1' ],
          cooldownMs: 4000,
          range: 1.5,
          simpleAttackDamage: 16,
          simpleAttackDamageVariance: 0.4, // ±40% damage (12-20)
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light attack
          animations: [ 'atk2' ],
          cooldownMs: 2000,
          range: 1.5,
          simpleAttackDamage: 9,
          simpleAttackDamageVariance: 0.1, // ±10% damage (6-8) 
          simpleAttackDamageDelayMs: 400, // Deal damage 400ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 18,
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
      health: 50,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-warrior.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Ratkin Warrior',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      ...options,
    });
  }
}