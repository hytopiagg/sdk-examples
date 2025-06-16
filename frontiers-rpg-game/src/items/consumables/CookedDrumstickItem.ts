import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedDrumstickItem extends BaseConsumableItem {
  static readonly id = 'cooked_drumstick';
  static readonly name = 'Cooked Drumstick';
  static readonly iconImageUri = 'icons/items/cooked-drumstick.png';
  static readonly consumeCooldownMs = 1500;
  static readonly description = `Heals 30hp. A roasted leg from a large Frontier fowl. Juicy and satisfying.`;
  static readonly buyPrice = 25;
  static readonly sellPrice = 12;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(30);
  }
}