import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class StonebellyFungusMushroomItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 400,
      consumeRequiresDamaged: true,
      name: 'Stonebelly Fungus Mushroom',
      description: `Heals 20hp. This mushroom is a favorite among Capfolk. Known for its bitter taste and thick stalk.`,
      iconImageUri: 'icons/items/stonebelly-fungus-mushroom.png',
      buyPrice: 10,
      rarity: 'unusual',
      sellPrice: 15,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(20);
  }
}