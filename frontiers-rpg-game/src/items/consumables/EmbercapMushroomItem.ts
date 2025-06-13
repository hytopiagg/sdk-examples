import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class EmbercapMushroomItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 400,
      consumeRequiresDamaged: true,
      name: 'Embercap Mushroom',
      description: `Heals 10hp. A fiery, spicy mushroom with a faint red glow.`,
      iconImageUri: 'icons/items/embercap-mushroom.png',
      buyPrice: 10,
      rarity: 'unusual',
      sellPrice: 15,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(10);
  }
}