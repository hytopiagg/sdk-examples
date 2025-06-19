import BaseMerchantEntity, { BaseMerchantEntityOptions } from '../../../entities/BaseMerchantEntity';
import MinorHealingPotionItem from '../../../items/consumables/MinorHealingPotionItem';
import RatkinTailItem from '../../../items/materials/RatkinTailItem';

export default class MerchantFinnEntity extends BaseMerchantEntity {
  public constructor(options?: Partial<BaseMerchantEntityOptions>) {
    super({
      buyableItemClasses: [
        MinorHealingPotionItem,
        RatkinTailItem,
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