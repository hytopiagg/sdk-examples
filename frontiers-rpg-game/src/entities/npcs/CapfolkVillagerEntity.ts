import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class CapfolkBoyEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-boy.gltf',
      modelScale: 0.5 + Math.random() * 0.15,
      moveAnimations: [ 'walk' ],
      moveAnimationSpeed: 2,
      moveSpeed: 3,
      name: 'Capfolk Boy',
      ...options,
    });
  }
}