import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class MinorHealingPotionItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 2000,
      consumeRequiresDamaged: true,
      name: 'Minor Healing Potion',
      description: `Restores 20 health when consumed. A common remedy used by Frontier travelers and novice adventurers.`,
      iconImageUri: 'icons/items/minor-healing-potion.png',
      buyPrice: 50,
      sellPrice: 5,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(20);
  }
}