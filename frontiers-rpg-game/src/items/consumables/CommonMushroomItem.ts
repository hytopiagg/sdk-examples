import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CommonMushroomItem extends BaseConsumableItem {
  static readonly id = 'common_mushroom';
  static readonly name = 'Common Mushroom';
  static readonly iconImageUri = 'icons/items/common-mushroom.png';
  static readonly consumeCooldownMs = 400;
  static readonly description = `Heals 5hp. A normal looking mushroom. It's probably safe to eat.`;
  static readonly buyPrice = 10;
  static readonly sellPrice = 4;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(5);
  }
}