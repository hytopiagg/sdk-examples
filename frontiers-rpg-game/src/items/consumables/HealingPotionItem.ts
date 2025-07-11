import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class HealingPotionItem extends BaseConsumableItem {
  static readonly id = 'healing_potion';
  static readonly name = 'Healing Potion';
  static readonly iconImageUri = 'icons/items/healing-potion.png';
  static readonly consumeCooldownMs = 2000;
  static readonly description = `A common remedy used by Frontier travelers and novice adventurers.`;
  static readonly buyPrice = 100;
  static readonly sellPrice = 20;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 100hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(100);
  }
}