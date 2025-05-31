import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";

export type RatkinWarriorEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinWarriorEntity extends BaseCombatEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      aggroRadius: 7.5,
      attacks: [
        {
          animations: [ 'atk1' ],
          cooldownMs: 4000,
          damage: 10,
          range: 2,
          reach: 3,
          weight: 1,
        },
        {
          animations: [ 'atk2' ],
          cooldownMs: 2000,
          damage: 20,
          range: 2,
          reach: 3,
          weight: 2,
        },
      ],
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