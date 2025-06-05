import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class RatkinTailItem extends BaseItem {
  public constructor(options?: BaseItemOptions) {
    super({
      name: 'Ratkin Tail',
      description: 'A tail from a ratkin.',
      iconImageUri: 'icons/items/ratkin-tail.png',
      stackable: true,
      ...options,
    });
  }
}