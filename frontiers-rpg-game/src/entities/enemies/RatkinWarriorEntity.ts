import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyesItem.ts";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";

export type RatkinWarriorEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy attack
          animations: [ 'atk1' ],
          cooldownMs: 4000,
          range: 2,
          simpleAttackDamage: 25,
          simpleAttackDamageVariance: 0.4, // ±40% damage (15-35)
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light attack
          animations: [ 'atk2' ],
          cooldownMs: 2000,
          range: 2,
          simpleAttackDamage: 10,
          simpleAttackDamageVariance: 0.1, // ±10% damage (9-11) 
          simpleAttackDamageDelayMs: 400, // Deal damage 400ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 250,
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