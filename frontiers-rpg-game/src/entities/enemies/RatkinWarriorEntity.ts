import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

export type RatkinWarriorEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      attackAnimations: [ 'atk1' ],
      attackCooldownMs: 2000,
      attackDamage: 10,
      attackRange: 2,
      attackReach: 3,
      name: 'Ratkin Warrior',
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-warrior.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      ...options,
    });
  }
}