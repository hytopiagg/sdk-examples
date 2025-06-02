import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

export type RatkinWarriorEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      attacks: [
        { // Heavy attack
          animations: [ 'atk1' ],
          damage: 20,
          damageVariance: 0.3, // ±20% damage (8-12)
          damageDelayMs: 1500, // Deal damage 1500ms into animation
          cooldownMs: 4000,
          range: 2,
          reach: 3,
          weight: 1,
        },
        { // Light attack
          animations: [ 'atk2' ],
          damage: 10,
          damageVariance: 0.3, // ±30% damage (14-26) 
          damageDelayMs: 600, // Deal damage 600ms into animation
          cooldownMs: 2000,
          range: 2,
          reach: 3,
          weight: 2,
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