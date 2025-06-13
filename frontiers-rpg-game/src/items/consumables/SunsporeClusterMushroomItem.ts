import BaseConsumableItem, { BaseConsumableItemOptions } from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class SunsporeClusterMushroomItem extends BaseConsumableItem {
  public constructor(options?: Partial<BaseConsumableItemOptions>) {
    super({
      consumeCooldownMs: 400,
      consumeRequiresDamaged: true,
      name: 'Sunspore Cluster Mushroom',
      description: `Heals 15hp. A large, spore-filled mushroom with a golden glow.`,
      iconImageUri: 'icons/items/sunspore-cluster-mushroom.png',
      buyPrice: 10,
      rarity: 'unusual',
      sellPrice: 15,
      stackable: true,
      ...options,
    });
  }

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(15);
  }
}