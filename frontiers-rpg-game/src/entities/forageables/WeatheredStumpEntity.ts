import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import GoldItem from '../../items/general/GoldItem';
import SunsporeClusterMushroomItem from '../../items/consumables/SunsporeClusterMushroomItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';
import WeaverEggItem from '../../items/materials/WeaverEggItem';
import WeaverSilkItem from '../../items/materials/WeaverSilkItem';

export type WeatheredStumpEntityOptions = {

} & BaseForageableEntityOptions;

export default class WeatheredStumpEntity extends BaseForageableEntity {
  public constructor(options?: WeatheredStumpEntityOptions) {
    super({
      forageDurationMs: 2000,
      itemDrops: [
        { itemClass: CommonMushroomItem, weight: 20, minQuantity: 1, maxQuantity: 3 },
        { itemClass: CommonSeedsItem, weight: 10 },
        { itemClass: SunsporeClusterMushroomItem, weight: 5, minQuantity: 1, maxQuantity: 3 },
        { itemClass: GoldItem, weight: 3, minQuantity: 13, maxQuantity: 24 },
        { itemClass: WeaverEggItem, weight: 2, minQuantity: 1, maxQuantity: 1 },
        { itemClass: WeaverSilkItem, weight: 2, minQuantity: 1, maxQuantity: 1 },
        { itemClass: UnusualSeedsItem, weight: 2 },
      ],
      maxDropsPerForage: 3,
      experienceReward: 18,
      modelUri: 'models/forageables/weathered-stump.gltf',
      modelLoopedAnimations: [ 'idle' ],
      name: 'Weathered Stump',
      ...options,
    });
  }
}