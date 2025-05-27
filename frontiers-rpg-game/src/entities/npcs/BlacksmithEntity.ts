import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class BlacksmithEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/blacksmith.gltf',
      modelScale: 0.75,
      name: 'Blacksmith',
      ...options,
    });
  }
}