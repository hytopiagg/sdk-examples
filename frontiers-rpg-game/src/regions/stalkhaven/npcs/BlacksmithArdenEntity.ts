import BaseCraftingEntity, { BaseCraftingEntityOptions } from '../../../entities/BaseCraftingEntity';

import GoldItem from '../../../items/general/GoldItem';
import LeatherBootsItem from '../../../items/wearables/LeatherBootsItem';
import LeatherBracersItem from '../../../items/wearables/LeatherBracersItem';
import LeatherHelmetItem from '../../../items/wearables/LeatherHelmetItem';
import LeatherLeggingsItem from '../../../items/wearables/LeatherLeggingsItem';
import LeatherVestItem from '../../../items/wearables/LeatherVestItem';
import RatkinBonesItem from '../../../items/materials/RatkinBonesItem';
import RatkinToothItem from '../../../items/materials/RatkinToothItem';
import RawHideItem from '../../../items/materials/RawHideItem';
import SpikedClubItem from '../../../items/weapons/SpikedClubItem';

export default class BlacksmithArdenEntity extends BaseCraftingEntity {
  public constructor(options?: Partial<BaseCraftingEntityOptions>) {
    super({
      craftingRecipes: [
        {
          craftedItemClass: LeatherHelmetItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 20,
            },
            {
              itemClass: GoldItem,
              quantity: 250,
            },
          ],
        },
        {
          craftedItemClass: LeatherVestItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 35,
            },
            {
              itemClass: GoldItem,
              quantity: 300,
            },
          ],
        },
        {
          craftedItemClass: LeatherBracersItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 15,
            },
            {
              itemClass: GoldItem,
              quantity: 200,
            },
          ],
        },
        {
          craftedItemClass: LeatherLeggingsItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 25,
            },
            {
              itemClass: GoldItem,
              quantity: 250,
            },
          ],
        },
        {
          craftedItemClass: LeatherBootsItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 15,
            },
            {
              itemClass: GoldItem,
              quantity: 200,
            },
          ],
        },
        {
          craftedItemClass: SpikedClubItem,
          requirements: [
            {
              itemClass: RatkinBonesItem,
              quantity: 30,
            },
            {
              itemClass: RatkinToothItem,
              quantity: 25,
            },
            {
              itemClass: RawHideItem,
              quantity: 5,
            },
            {
              itemClass: GoldItem,
              quantity: 400,
            },
          ],
        },
      ],
      dialogueAvatarImageUri: 'avatars/blacksmith.png',
      dialogueTitle: 'Apprentice Blacksmith',
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/blacksmith.gltf',
      modelScale: 0.75,
      name: 'Blacksmith Arden',
      ...options,
    })
  }
}