import BaseForageableEntity, { BaseForageableEntityOptions } from '../BaseForageableEntity';

// Forageable Items
import CookedDrumstickItem from '../../items/consumables/CookedDrumstickItem';
import CookedMeatItem from '../../items/consumables/CookedMeatItem';
import CookedMeatSkewerItem from '../../items/consumables/CookedMeatSkewerItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import GoldItem from '../../items/general/GoldItem';
import GoldIngotItem from '../../items/materials/GoldIngotItem';
import IronIngotItem from '../../items/materials/IronIngotItem';
import LeatherBootsItem from '../../items/wearables/LeatherBootsItem';
import LeatherBracersItem from '../../items/wearables/LeatherBracersItem';
import LeatherHelmetItem from '../../items/wearables/LeatherHelmetItem';
import LeatherLeggingsItem from '../../items/wearables/LeatherLeggingsItem';
import LeatherVestItem from '../../items/wearables/LeatherVestItem';
import HealingPotionItem from '../../items/consumables/HealingPotionItem';
import MinorHealingPotionItem from '../../items/consumables/MinorHealingPotionItem';
import RareSeedsItem from '../../items/seeds/RareSeedsItem';
import RawHideItem from '../../items/materials/RawHideItem';
import ShackleItem from '../../items/materials/ShackleItem';

export type AbandonedCrateEntityOptions = {

} & BaseForageableEntityOptions;

export default class AbandonedCrateEntity extends BaseForageableEntity {
  public constructor(options?: AbandonedCrateEntityOptions) {
    super({
      forageDurationMs: 2500,
      itemDrops: [
          { itemClass: CookedDrumstickItem, weight: 45, minQuantity: 1, maxQuantity: 3 },
          { itemClass: CookedMeatItem, weight: 45, minQuantity: 1, maxQuantity: 3 },
          { itemClass: CookedMeatSkewerItem, weight: 45, minQuantity: 1, maxQuantity: 3 },
          { itemClass: MinorHealingPotionItem, weight: 45, minQuantity: 1, maxQuantity: 3 },
          { itemClass: HealingPotionItem, weight: 45, minQuantity: 1, maxQuantity: 3 },
          { itemClass: CommonSeedsItem, weight: 25 },
          { itemClass: GoldItem, weight: 15, minQuantity: 10, maxQuantity: 100 },
          { itemClass: RawHideItem, weight: 15, minQuantity: 1, maxQuantity: 3 },
          { itemClass: ShackleItem, weight: 15, minQuantity: 1, maxQuantity: 3 },
          { itemClass: IronIngotItem, weight: 10, minQuantity: 1, maxQuantity: 3 },
          { itemClass: LeatherBootsItem, weight: 3, minQuantity: 1, maxQuantity: 3 },
          { itemClass: LeatherBracersItem, weight: 3, minQuantity: 1, maxQuantity: 3 },
          { itemClass: LeatherHelmetItem, weight: 3, minQuantity: 1, maxQuantity: 3 },
          { itemClass: LeatherLeggingsItem, weight: 3, minQuantity: 1, maxQuantity: 3 },
          { itemClass: LeatherVestItem, weight: 3, minQuantity: 1, maxQuantity: 3 },
          { itemClass: RareSeedsItem, weight: 1, minQuantity: 1, maxQuantity: 3 },
          { itemClass: GoldIngotItem, weight: 1, minQuantity: 1, maxQuantity: 1 },
      ],
      maxDropsPerForage: 3,
      experienceReward: 25,
      modelUri: 'models/forageables/abandoned-crate.gltf',
      modelLoopedAnimations: [ 'idle' ],
      name: 'Abandoned Crate',
      ...options,
    });
  }
}