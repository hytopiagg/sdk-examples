import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class MerchantEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/merchant.gltf',
      modelScale: 0.75,
      name: 'Merchant',
      ...options,
    });
  }
}