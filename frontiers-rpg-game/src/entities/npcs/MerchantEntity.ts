import BaseMerchantEntity, { BaseMerchantEntityOptions } from '../BaseMerchantEntity';
import RatkinTailItem from '../../items/materials/RatkinTailItem';
import WoodenSwordItem from '../../items/weapons/WoodenSwordItem';

export default class MerchantEntity extends BaseMerchantEntity {
  public constructor(options?: Partial<BaseMerchantEntityOptions>) {
    super({
      buyableItems: [
        new WoodenSwordItem({ buyPrice: 10 }),
        new RatkinTailItem({ buyPrice: 5 }),
      ],
      dialogueAvatarImageUri: 'avatars/merchant.png',
      dialogueTitle: 'Goods Vendor',
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/merchant.gltf',
      modelScale: 0.75,
      name: 'Merchant Finn',
      ...options,
    });
  }
}