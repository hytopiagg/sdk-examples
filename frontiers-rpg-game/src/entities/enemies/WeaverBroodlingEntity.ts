import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

// Drops
import GoldItem from "../../items/general/GoldItem";

export type WeaverBroodlingEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class WeaverBroodlingEntity extends BaseCombatEntity {
  constructor(options?: WeaverBroodlingEntityOptions) {
    super({
      aggroRadius: 12,
      aggroSensorForwardOffset: 0,
      attacks: [
        { // Bite attack
          animations: [ 'fang_attack' ],
          cooldownMs: 2000,
          range: 2,
          simpleAttackDamage: 17,
          simpleAttackDamageVariance: 0.1,
          simpleAttackDamageDelayMs: 600,
          weight: 1,
        }
      ],
      combatExperienceReward: 30,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 16, maxQuantity: 24, weight: 2 },
      ],
      health: 140,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/weaver-broodling.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Weaver Broodling',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      tintColor: { r: 64, g: 255, b: 64 },
      ...options,
    });
  }
}