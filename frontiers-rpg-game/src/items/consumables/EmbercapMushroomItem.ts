import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class EmbercapMushroomItem extends BaseConsumableItem {
  static readonly id = 'embercap_mushroom';
  static readonly name = 'Embercap Mushroom';
  static readonly iconImageUri = 'icons/items/embercap-mushroom.png';
  static readonly consumeCooldownMs = 400;
  static readonly description = `A fiery-colored mushroom that grows in the charred remains of forest fires.`;
  static readonly buyPrice = 10;
  static readonly rarity = 'unusual';
  static readonly sellPrice = 15;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  static readonly statTexts = [ 'Heals 10hp' ];

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(10);
  }
}