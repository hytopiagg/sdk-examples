import BaseMerchantEntity, { BaseMerchantEntityOptions } from '../BaseMerchantEntity';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import RatkinTailItem from '../../items/materials/RatkinTailItem';
import WoodenSwordItem from '../../items/weapons/WoodenSwordItem';

export default class MerchantFinnEntity extends BaseMerchantEntity {
  public constructor(options?: Partial<BaseMerchantEntityOptions>) {
    super({
      buyableItemClasses: [
        MinorHealingPotionItem,
        WoodenSwordItem,
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