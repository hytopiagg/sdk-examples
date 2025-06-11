import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';

export default class MinorHealingPotionItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeAnimations: [ 'drink' ],
      consumeCooldownMs: 2000,
      name: 'Minor Healing Potion',
      description: `Restores 20 health when consumed. A common remedy used by Frontier travelers and novice adventurers.`,
      iconImageUri: 'icons/items/minor-healing-potion.png',
      buyPrice: 50,
      sellPrice: 5,
      stackable: true,
      ...options,
    });
  }
}