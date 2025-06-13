import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedDrumstickItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 1500,
      consumeRequiresDamaged: true,
      name: 'Cooked Drumstick',
      description: `Heals 10hp. A cooked drumstick from some kind of Frontier bird.`,
      iconImageUri: 'icons/items/cooked-drumstick.png',
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