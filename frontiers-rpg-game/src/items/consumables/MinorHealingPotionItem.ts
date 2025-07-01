import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class MinorHealingPotionItem extends BaseConsumableItem {
  static readonly id = 'minor_healing_potion';
  static readonly name = 'Minor Healing Potion';
  static readonly iconImageUri = 'icons/items/minor-healing-potion.png';
  static readonly consumeCooldownMs = 2000;
  static readonly description = `A common remedy used by Frontier travelers and novice adventurers.`;
  static readonly buyPrice = 25;
  static readonly sellPrice = 5;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 35hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(35);
  }
}