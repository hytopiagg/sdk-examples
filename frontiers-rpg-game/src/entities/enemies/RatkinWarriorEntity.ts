import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import WoodenSwordItem from "../../items/weapons/WoodenSwordItem";

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
          damage: 25,
          damageVariance: 0.4, // ±40% damage (15-35)
          damageDelayMs: 1000, // Deal damage 1000ms into animation
          cooldownMs: 4000,
          range: 2,
          reach: 3,
          weight: 1,
        },
        { // Light attack
          animations: [ 'atk2' ],
          damage: 10,
          damageVariance: 0.1, // ±10% damage (9-11) 
          damageDelayMs: 400, // Deal damage 400ms into animation
          cooldownMs: 2000,
          range: 2,
          reach: 3,
          weight: 2,
        },
      ],
      combatExperienceReward: 50,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        {
          item: new WoodenSwordItem(),
          probability: 1,
        },
      ],
      health: 100,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-warrior.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Ratkin Warrior',
      ...options,
    });
  }
}