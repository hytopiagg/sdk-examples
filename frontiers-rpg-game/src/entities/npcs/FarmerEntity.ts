import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class BankerEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/farmer2.gltf',
      modelScale: 0.75,
      name: 'Farmer',
      ...options,
    });
  }
}