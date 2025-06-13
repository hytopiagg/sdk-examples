import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class MonsterHideItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Monster Hide',
      description: 'A regular sized hide from a Frontier monster.',
      iconImageUri: 'icons/items/monster-hide.png',
      stackable: true,
      sellPrice: 10,
      ...options,
    });
  }
}