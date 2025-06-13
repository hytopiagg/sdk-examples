import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyes";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";

export type RatkinBruteEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinBruteEntity extends BaseCombatEntity {
  constructor(options?: RatkinBruteEntityOptions) {
    super({
      aggroRadius: 7.5,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Heavy body slam attack
          animations: [ 'atk1' ],
          cooldownMs: 4000,
          range: 2,
          simpleAttackDamage: 25,
          simpleAttackDamageVariance: 0.6, // ±60% damage
          simpleAttackDamageDelayMs: 1000, // Deal damage 1000ms into animation
          simpleAttackReach: 3,
          weight: 1,
        },
        { // Light hammer swing attack
          animations: [ 'atk2' ],
          cooldownMs: 1500,
          range: 2,
          simpleAttackDamage: 13,
          simpleAttackDamageVariance: 0.15, // ±15% damage
          simpleAttackDamageDelayMs: 500, // Deal damage 500ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
        { // Light hammer swing 2 attack
          animations: [ 'atk3' ],
          cooldownMs: 1500,
          range: 2,
          simpleAttackDamage: 9,
          simpleAttackDamageVariance: 0.15, // ±15% damage
          simpleAttackDamageDelayMs: 350, // Deal damage 350ms into animation
          simpleAttackReach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 250,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        {
          item: new GoldItem(),
          minQuantity: 30,
          maxQuantity: 70,
          weight: 2,
        },
        {
          item: new CommonMushroomItem(),
          minQuantity: 1,
          maxQuantity: 3,
          weight: 1,
        },
        {
          item: new CommonSeedsItem(),
          weight: 0.5,
        },
        {
          item: new RatkinBonesItem(),
          weight: 0.8,
        },
        {
          item: new RatkinEyesItem(),
          weight: 0.8,
        },
        {
          item: new RatkinToothItem(),
          weight: 0.8,
        },
        {
          item: new RatkinTailItem(),
          weight: 0.8,
        },
      ],
      health: 140,
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