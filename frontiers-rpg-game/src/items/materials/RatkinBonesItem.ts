import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class RatkinBonesItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Ratkin Bones',
      description: 'A pile of bones from a Ratkin. Strangely fragile.',
      iconImageUri: 'icons/items/ratkin-bones.png',
      stackable: true,
      sellPrice: 5,
      ...options,
    });
  }
}