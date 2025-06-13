import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import EmbercapMushroomItem from '../../items/consumables/EmbercapMushroomItem';
import GoldItem from '../../items/general/GoldItem';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import MonsterHideItem from '../../items/materials/MonsterHideItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';

export type ForageableLogEntityOptions = {

} & BaseForageableEntityOptions;

export default class ForageableLogEntity extends BaseForageableEntity {
  public constructor(options?: ForageableLogEntityOptions) {
    super({
      forageDurationMs: 2000,
      forageItemDrops: [
        { item: new CommonMushroomItem(), weight: 100, minQuantity: 1, maxQuantity: 3 },
        { item: new CommonSeedsItem(), weight: 50 },
        { item: new EmbercapMushroomItem(), weight: 20, minQuantity: 1, maxQuantity: 3 },
        { item: new GoldItem(), weight: 15, minQuantity: 6, maxQuantity: 17 },
        { item: new MinorHealingPotionItem(), weight: 25 },
        { item: new MonsterHideItem(), weight: 10 },
        { item: new UnusualSeedsItem(), weight: 1 },
      ],
      forageItemMaxDrops: 3,
      foragingExperienceReward: 25,
      modelUri: 'models/forageables/fallen-log.gltf',
      modelScale: 0.5,
      name: 'Rotten Log',
      ...options,
    });
  }
}