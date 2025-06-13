import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class RatkinEyesItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Ratkin Eyes',
      description: 'A pair of eyes from a Ratkin. They glow in the dark!',
      iconImageUri: 'icons/items/ratkin-eyes.png',
      stackable: true,
      sellPrice: 10,
      ...options,
    });
  }
}