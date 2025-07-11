import BaseCraftingEntity, { BaseCraftingEntityOptions } from '../../../entities/BaseCraftingEntity';

import GoldItem from '../../../items/general/GoldItem';
import IronIngotItem from '../../../items/materials/IronIngotItem';
import IronChestplateItem from '../../../items/wearables/IronChestplateItem';
import IronGauntletsItem from '../../../items/wearables/IronGauntletsItem';
import IronGrievesItem from '../../../items/wearables/IronGrievesItem';
import IronHelmetItem from '../../../items/wearables/IronHelmetItem';
import IronLeggingsItem from '../../../items/wearables/IronLeggingsItem';
import LeatherBootsItem from '../../../items/wearables/LeatherBootsItem';
import LeatherBracersItem from '../../../items/wearables/LeatherBracersItem';
import LeatherHelmetItem from '../../../items/wearables/LeatherHelmetItem';
import LeatherLeggingsItem from '../../../items/wearables/LeatherLeggingsItem';
import LeatherVestItem from '../../../items/wearables/LeatherVestItem';
import RatkinBonesItem from '../../../items/materials/RatkinBonesItem';
import RatkinToothItem from '../../../items/materials/RatkinToothItem';
import RawHideItem from '../../../items/materials/RawHideItem';
import ShackleItem from '../../../items/materials/ShackleItem';
import SpikedClubItem from '../../../items/weapons/SpikedClubItem';

export default class BlacksmithArdenEntity extends BaseCraftingEntity {
  public constructor(options?: Partial<BaseCraftingEntityOptions>) {
    super({
      craftingRecipes: [
        // Leather set wearables
        {
          craftedItemClass: LeatherHelmetItem,
          requirements: [
            {
              itemClass: RawHideItem,
              quantity: 20,
            },
            {
              itemClass: GoldItem,
              quantity: 125,
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
              quantity: 150,
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
              quantity: 100,
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
              quantity: 125,
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
              quantity: 100,
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

        // Iron set wearables
        {
          craftedItemClass: IronHelmetItem,
          requirements: [
            {
              itemClass: IronIngotItem,
              quantity: 5,
            },
            {
              itemClass: RawHideItem,
              quantity: 5,
            },
            {
              itemClass: GoldItem,
              quantity: 250,
            },
          ]
        },
        {
          craftedItemClass: IronChestplateItem,
          requirements: [
            {
              itemClass: IronIngotItem,
              quantity: 15,
            },
            {
              itemClass: RawHideItem,
              quantity: 10,
            },
            {
              itemClass: ShackleItem,
              quantity: 2,
            },
            {
              itemClass: GoldItem,
              quantity: 650,
            },
          ]
        },
        {
          craftedItemClass: IronGauntletsItem,
          requirements: [
            {
              itemClass: IronIngotItem,
              quantity: 5,
            },
            {
              itemClass: RawHideItem,
              quantity: 5,
            },
            {
              itemClass: ShackleItem,
              quantity: 4,
            },
            {
              itemClass: GoldItem,
              quantity: 250,
            },
          ]
        },
        {
          craftedItemClass: IronLeggingsItem,
          requirements: [
            {
              itemClass: IronIngotItem,
              quantity: 10,
            },
            {
              itemClass: RawHideItem,
              quantity: 10,
            },
            {
              itemClass: ShackleItem,
              quantity: 4,
            },
            {
              itemClass: GoldItem,
              quantity: 400,
            },
          ]
        },
        {
          craftedItemClass: IronGrievesItem,
          requirements: [
            {
              itemClass: IronIngotItem,
              quantity: 5,
            },
            {
              itemClass: RawHideItem,
              quantity: 5,
            },
            {
              itemClass: ShackleItem,
              quantity: 2,
            },
            {
              itemClass: GoldItem,
              quantity: 250,
            },
          ]
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