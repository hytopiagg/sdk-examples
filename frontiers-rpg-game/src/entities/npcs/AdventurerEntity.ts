import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class AdventurerEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/adventurer.gltf',
      modelScale: 0.75,
      name: 'Adventurer',
      ...options,
    });
  }
}