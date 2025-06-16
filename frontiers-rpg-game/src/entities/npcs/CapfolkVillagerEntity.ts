import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class CapfolkVillagerEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-boy.gltf',
      modelScale: 0.5 + Math.random() * 0.15,
      moveAnimations: [ 'walk' ],
      moveAnimationSpeed: 3,
      moveSpeed: 2.5,
      name: 'Capfolk Villager',
      ...options,
    });
  }
}