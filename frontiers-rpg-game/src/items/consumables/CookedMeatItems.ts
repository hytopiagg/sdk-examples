import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedMeatItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 1500,
      consumeRequiresDamaged: true,
      name: 'Cooked Meat',
      description: `Heals 35hp. A hefty piece of seared meat cut from a Frontier animal.`,
      iconImageUri: 'icons/items/cooked-meat.png',
      buyPrice: 20,
      sellPrice: 10,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(35);
  }
}