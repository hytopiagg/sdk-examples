import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import EmbercapMushroomItem from '../../items/consumables/EmbercapMushroomItem';
import GoldItem from '../../items/general/GoldItem';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import MonsterHideItem from '../../items/materials/MonsterHideItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';

export type DecayingPileEntityOptions = {

} & BaseForageableEntityOptions;

export default class DecayingPileEntity extends BaseForageableEntity {
  public constructor(options?: DecayingPileEntityOptions) {
    super({
      forageDurationMs: 2000,
      itemDrops: [
        { itemClass: GoldItem, weight: 15, minQuantity: 6, maxQuantity: 17 },
      ],
      maxDropsPerForage: 3,
      experienceReward: 50,
      modelUri: 'models/forageables/decaying-pile.gltf',
      modelScale: 0.7,
      name: 'Decaying Pile',
      ...options,
    });
  }
}