import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CommonMushroomItem extends BaseConsumableItem {
  static readonly id = 'common_mushroom';
  static readonly name = 'Common Mushroom';
  static readonly iconImageUri = 'icons/items/common-mushroom.png';
  static readonly consumeCooldownMs = 400;
  static readonly description = `A normal looking mushroom. It's probably safe to eat.`;
  static readonly buyPrice = 35;
  static readonly sellPrice = 3;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 5hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(5);
  }
}