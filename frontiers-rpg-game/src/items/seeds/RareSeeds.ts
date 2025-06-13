import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class CommonSeedsItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Rare Seeds',
      description: `[4CAF50]Plantable[/][b]These seeds seem special. Something exotic may grow from them!`,
      iconImageUri: 'icons/items/rare-seeds.png',
      rarity: 'rare',
      stackable: true,
      ...options,
    });
  }
}