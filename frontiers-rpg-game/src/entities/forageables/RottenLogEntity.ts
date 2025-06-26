import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import EmbercapMushroomItem from '../../items/consumables/EmbercapMushroomItem';
import GoldItem from '../../items/general/GoldItem';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import RawHideItem from '../../items/materials/RawHideItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';

export type RottenLogEntityOptions = {

} & BaseForageableEntityOptions;

export default class RottenLogEntity extends BaseForageableEntity {
  public constructor(options?: RottenLogEntityOptions) {
    super({
      forageDurationMs: 2000,
      itemDrops: [
        { itemClass: CommonMushroomItem, weight: 100, minQuantity: 1, maxQuantity: 3 },
        { itemClass: CommonSeedsItem, weight: 25 },
        { itemClass: MinorHealingPotionItem, weight: 25 },
        { itemClass: GoldItem, weight: 15, minQuantity: 6, maxQuantity: 17 },
        { itemClass: RawHideItem, weight: 10 },
        { itemClass: EmbercapMushroomItem, weight: 5, minQuantity: 1, maxQuantity: 3 },
        { itemClass: UnusualSeedsItem, weight: 1 },
      ],
      maxDropsPerForage: 3,
      experienceReward: 8,
      modelUri: 'models/forageables/fallen-log.gltf',
      modelScale: 0.5,
      name: 'Rotten Log',
      ...options,
    });
  }
}