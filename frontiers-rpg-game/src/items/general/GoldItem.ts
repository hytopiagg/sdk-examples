import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class GoldItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Gold',
      description: `Bright coins minted in Stalkhaven's frontier foundry. Sought by all who travel The Frontier and beyond.`,
      iconImageUri: 'icons/items/gold.png',
      sellPrice: 0,
      stackable: true,
      ...options,
    });
  }
}