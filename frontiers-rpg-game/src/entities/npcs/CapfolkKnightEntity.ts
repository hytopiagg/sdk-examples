import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class CapfolkKnightEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-knight.gltf',
      modelScale: 0.5 + Math.random() * 0.2,
      moveAnimations: [ 'walk' ],
      moveAnimationSpeed: 2,
      moveSpeed: 3,
      name: 'Capfolk Knight',
      pushable: false,
      ...options,
    });
  }
}