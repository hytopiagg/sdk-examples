import BaseItem from '../BaseItem';

export default class SilverSlabItem extends BaseItem {
  static readonly id = 'silver_slab';
  static readonly name = 'Silver Slab';
  static readonly iconImageUri = 'icons/items/silver-slab.png';
  static readonly description = 'A slab of silver, ready for crafting.';
  static readonly rarity = 'unusual';
  static readonly stackable = true;
  static readonly sellPrice = 80;
}