import BaseEnemyEntity, { BaseEnemyEntityOptions } from "../BaseEnemyEntity";

export type RatkinWarriorEntityOptions = {

} & BaseEnemyEntityOptions;

export default class RatkinWarriorEntity extends BaseEnemyEntity {
  constructor(options?: RatkinWarriorEntityOptions) {
    super({
      name: 'Ratkin Warrior',
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-warrior.gltf',
      modelScale: 0.65,
      moveAnimations: [ 'walk' ],
      moveSpeed: 6,
      ...options,
    });
  }
}