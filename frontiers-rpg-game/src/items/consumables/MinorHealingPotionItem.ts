import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

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

  public override consume(): void {
    if (!this.entity?.parent) return;

    const gamePlayerEntity = this.entity.parent as GamePlayerEntity;

    // Don't consume if player is at max health
    if (gamePlayerEntity.health >= gamePlayerEntity.maxHealth) {
      return;
    }

    super.consume();
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(20);
  }
}