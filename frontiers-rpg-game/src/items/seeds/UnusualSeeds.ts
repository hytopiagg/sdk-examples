import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class CommonSeedsItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Unusual Seeds',
      description: `[4CAF50]Plantable[/][b]A small amount of seeds not found in the Frontier. It's unclear what will grow if you plant these.`,
      iconImageUri: 'icons/items/unusual-seeds.png',
      rarity: 'unusual',
      stackable: true,
      ...options,
    });
  }
}