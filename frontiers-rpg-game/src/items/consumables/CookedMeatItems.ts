import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedMeatItem extends BaseConsumableItem {
  static readonly id = 'cooked_meat';
  static readonly name = 'Cooked Meat';
  static readonly iconImageUri = 'icons/items/cooked-meat.png';
  static readonly consumeCooldownMs = 1500;
  static readonly description = `A hefty piece of seared meat cut from a Frontier animal.`;
  static readonly buyPrice = 20;
  static readonly sellPrice = 10;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 35hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(35);
  }
}