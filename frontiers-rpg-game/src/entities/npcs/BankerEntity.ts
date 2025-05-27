import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class BankerEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/banker.gltf',
      modelScale: 0.75,
      name: 'Banker',
      ...options,
    });
  }
}