import BaseMerchantEntity, { BaseMerchantEntityOptions } from '../../../entities/BaseMerchantEntity';

import AdventurerBootsItem from '../../../items/wearables/AdventurerBootsItem';
import AdventurerGlovesItem from '../../../items/wearables/AdventurerGlovesItem';
import AdventurerHoodItem from '../../../items/wearables/AdventurerHoodItem';
import AdventurerLeggingsItem from '../../../items/wearables/AdventurerLeggingsItem';
import AdventurerTunicItem from '../../../items/wearables/AdventurerTunicItem';
import DullSwordItem from '../../../items/weapons/DullSwordItem';
import CommonMushroomItem from '../../../items/consumables/CommonMushroomItem';
import IronDaggerItem from '../../../items/weapons/IronDaggerItem';
import IronLongSwordItem from '../../../items/weapons/IronLongSwordItem';
import MinorHealingPotionItem from '../../../items/consumables/MinorHealingPotionItem';

export default class MerchantFinnEntity extends BaseMerchantEntity {
  public constructor(options?: Partial<BaseMerchantEntityOptions>) {
    super({
      buyableItemClasses: [
        AdventurerHoodItem,
        AdventurerTunicItem,
        AdventurerGlovesItem,
        AdventurerLeggingsItem,
        AdventurerBootsItem,
        DullSwordItem,
        IronDaggerItem,
        IronLongSwordItem,
        MinorHealingPotionItem,
        CommonMushroomItem,
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