import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class SunsporeClusterMushroomItem extends BaseConsumableItem {
  static readonly id = 'sunspore_cluster_mushroom';
  static readonly name = 'Sunspore Cluster Mushroom';
  static readonly iconImageUri = 'icons/items/sunspore-cluster-mushroom.png';
  static readonly consumeCooldownMs = 400;
  static readonly description = `A large, spore-filled mushroom with a golden glow.`;
  static readonly buyPrice = 250;
  static readonly rarity = 'unusual';
  static readonly sellPrice = 25;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 15hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(15);
  }
}