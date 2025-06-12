import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import GoldItem from "../../items/general/GoldItem";
import WoodenSwordItem from "../../items/weapons/WoodenSwordItem";

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
          minQuantity: 50,
          maxQuantity: 70,
          weight: 1,
        },
        {
          item: new WoodenSwordItem(),
          weight: 0.1,
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