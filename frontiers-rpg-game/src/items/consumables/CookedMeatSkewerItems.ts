import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class CookedMeatSkewerItem extends BaseConsumableItem {
  static readonly id = 'cooked_meat_skewer';
  static readonly name = 'Cooked Meat Skewer';
  static readonly iconImageUri = 'icons/items/cooked-meat-skewer.png';
  static readonly consumeCooldownMs = 1500;
  static readonly description = `Heals 25hp. Tender chunks of meat on a wooden skewer. A portable meal for adventurers.`;
  static readonly buyPrice = 20;
  static readonly sellPrice = 10;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(25);
  }
}