import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class CapfolkElderEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-elder.gltf',
      modelScale: 0.6,
      moveAnimations: [ 'walk' ],
      moveAnimationSpeed: 2,
      moveSpeed: 3,
      name: 'Capfolk Elder',
      pushable: false,
      ...options,
    });
  }
}