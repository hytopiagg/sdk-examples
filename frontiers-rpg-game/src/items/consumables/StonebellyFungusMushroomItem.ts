import BaseConsumableItem from '../BaseConsumableItem';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class StonebellyFungusMushroomItem extends BaseConsumableItem {
  static readonly id = 'stonebelly_fungus_mushroom';
  static readonly name = 'Stonebelly Fungus Mushroom';
  static readonly iconImageUri = 'icons/items/stonebelly-fungus-mushroom.png';
  static readonly consumeCooldownMs = 400;
  static readonly description = `Heals 20hp. This mushroom is a favorite among Capfolk. Known for its bitter taste and thick stalk.`;
  static readonly buyPrice = 10;
  static readonly rarity = 'unusual';
  static readonly sellPrice = 15;
  static readonly stackable = true;
  static readonly consumeRequiresDamaged = true;

  protected override applyEffects(playerEntity: GamePlayerEntity): void {
    playerEntity.gamePlayer.adjustHealth(20);
  }
}