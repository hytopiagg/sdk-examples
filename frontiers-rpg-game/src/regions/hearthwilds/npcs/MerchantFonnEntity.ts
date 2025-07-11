import BaseMerchantEntity, { BaseMerchantEntityOptions } from '../../../entities/BaseMerchantEntity';

import HealingPotionItem from '../../../items/consumables/HealingPotionItem';
import LeatherBootsItem from '../../../items/wearables/LeatherBootsItem';
import LeatherBracersItem from '../../../items/wearables/LeatherBracersItem';
import LeatherHelmetItem from '../../../items/wearables/LeatherHelmetItem';
import LeatherLeggingsItem from '../../../items/wearables/LeatherLeggingsItem';
import LeatherVestItem from '../../../items/wearables/LeatherVestItem';
import MinorHealingPotionItem from '../../../items/consumables/MinorHealingPotionItem';
import SpikedClubItem from '../../../items/weapons/SpikedClubItem';

export default class MerchantFonnEntity extends BaseMerchantEntity {
  public constructor(options?: Partial<BaseMerchantEntityOptions>) {
    super({
      buyableItemClasses: [
        LeatherHelmetItem,
        LeatherVestItem,
        LeatherBracersItem,
        LeatherLeggingsItem,
        LeatherBootsItem,
        SpikedClubItem,
        HealingPotionItem,
        MinorHealingPotionItem,
      ],
      dialogueAvatarImageUri: 'avatars/merchant.png',
      dialogueTitle: 'Goods Vendor',
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/merchant.gltf',
      modelScale: 0.75,
      name: 'Merchant Fonn',
      additionalDialogueOptions: [
        {
          text: `You look oddly familiar.`,
          nextDialogue: {
            text: `Ah, you must have met my brother in Stalkhaven! That would be Merchant Finn - we get that a lot. I come from a large merchant family with many brothers spread across the Eastern Frontier. We've been in the trading business for generations, each of us finding our own corner of the world to serve. Finn got the big city, I got the Hearthwilds. Can't say I mind it much - less competition, more adventure!`,
            options: [
              {
                text: `That explains the resemblance.`,
                dismiss: true,
                pureExit: true,
              },
            ]
          }
        },
        {
          text: `Why are you out here with all this fog around?`,
          nextDialogue: {
            text: `Business has been surprisingly good, actually! All this fog and trouble has adventurers coming through in droves - and adventurers always need supplies. Sure, I have to be careful and avoid the Gorkin hunting parties and other odd beasts that wander through from time to time, but the profit margins are excellent when you're one of the few merchants brave enough to set up shop in the wilderness.`,
            options: [
              {
                text: `That's good entrepreneurial spirit.`,
                dismiss: true,
                pureExit: true,
              },
            ]
          }
        },
      ],
      ...options,
    });
  }
}