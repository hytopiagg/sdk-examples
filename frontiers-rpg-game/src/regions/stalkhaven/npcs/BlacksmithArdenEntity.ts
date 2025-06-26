import BaseCraftingEntity, { BaseCraftingEntityOptions } from '../../../entities/BaseCraftingEntity';

import DullSwordItem from '../../../items/weapons/DullSwordItem';
import GoldItem from '../../../items/general/GoldItem';
import IronLongSwordItem from '../../../items/weapons/IronLongSwordItem';

export default class BlacksmithArdenEntity extends BaseCraftingEntity {
  public constructor(options?: Partial<BaseCraftingEntityOptions>) {
    super({
      craftingRecipes: [
        {
          craftedItemClass: IronLongSwordItem,
          requirements: [
            {
              itemClass: DullSwordItem,
              quantity: 1,
            },
            {
              itemClass: GoldItem,
              quantity: 10,
            },
          ]
        }
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