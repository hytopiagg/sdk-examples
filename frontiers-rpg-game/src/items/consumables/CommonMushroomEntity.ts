import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CommonMushroomItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 400,
      consumeRequiresDamaged: true,
      name: 'Common Mushroom',
      description: `Heals 5hp. A normal looking mushroom. It's probably safe to eat.`,
      iconImageUri: 'icons/items/common-mushroom.png',
      buyPrice: 10,
      sellPrice: 4,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(5);
  }
}