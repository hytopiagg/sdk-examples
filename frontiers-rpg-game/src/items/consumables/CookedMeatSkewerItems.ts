import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedMeatSkewerItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 1500,
      consumeRequiresDamaged: true,
      name: 'Cooked Meat Skewer',
      description: `Heals 25hp. Hearty pieces of meat seasoned with Frontier herbs.`,
      iconImageUri: 'icons/items/cooked-meat-skewer.png',
      buyPrice: 10,
      sellPrice: 4,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(10);
  }
}