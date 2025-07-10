import BaseItem from '../BaseItem';

export default class GoldIngotItem extends BaseItem {
  static readonly id = 'gold_ingot';
  static readonly name = 'Gold Ingot';
  static readonly iconImageUri = 'icons/items/gold-ingot.png';
  static readonly description = 'An ingot of gold, ready for crafting.';
  static readonly rarity = 'unusual';
  static readonly stackable = true;
  static readonly sellPrice = 100;
}