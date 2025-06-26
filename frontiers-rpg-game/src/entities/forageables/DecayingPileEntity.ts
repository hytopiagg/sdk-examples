import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import GoldItem from '../../items/general/GoldItem';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import RawHideItem from '../../items/materials/RawHideItem';
import StonebellyFungusMushroomItem from '../../items/consumables/StonebellyFungusMushroomItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';

export type DecayingPileEntityOptions = {

} & BaseForageableEntityOptions;

export default class DecayingPileEntity extends BaseForageableEntity {
  public constructor(options?: DecayingPileEntityOptions) {
    super({
      forageDurationMs: 2000,
      itemDrops: [
        { itemClass: CommonMushroomItem, weight: 100, minQuantity: 1, maxQuantity: 3 },
        { itemClass: CommonSeedsItem, weight: 35 },
        { itemClass: GoldItem, weight: 15, minQuantity: 9, maxQuantity: 20 },
        { itemClass: MinorHealingPotionItem, weight: 25 },
        { itemClass: RawHideItem, weight: 12 },
        { itemClass: StonebellyFungusMushroomItem, weight: 5, minQuantity: 1, maxQuantity: 3 },
        { itemClass: UnusualSeedsItem, weight: 3 },
      ],
      maxDropsPerForage: 3,
      experienceReward: 15,
      modelUri: 'models/forageables/decaying-pile.gltf',
      modelLoopedAnimations: [ 'idle' ],
      modelScale: 1.2,
      name: 'Decaying Pile',
      ...options,
    });
  }
}