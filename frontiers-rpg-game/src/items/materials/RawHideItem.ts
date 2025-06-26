import BaseItem from '../BaseItem';

export default class RawHideItem extends BaseItem {
  static readonly id = 'raw_hide';
  static readonly name = 'Raw Hide';
  static readonly iconImageUri = 'icons/items/raw-hide.png';
  static readonly description = 'Thick hide from a Frontier creature. Tough and weathered.';
  static readonly stackable = true;
  static readonly sellPrice = 15;
}