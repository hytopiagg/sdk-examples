import BaseItem from '../BaseItem';

export default class IronIngotItem extends BaseItem {
  static readonly id = 'iron_ingot';
  static readonly name = 'Iron Ingot';
  static readonly iconImageUri = 'icons/items/iron-ingot.png';
  static readonly description = 'An ingot of iron, ready for crafting.';
  static readonly rarity = 'unusual';
  static readonly stackable = true;
  static readonly sellPrice = 75;
}