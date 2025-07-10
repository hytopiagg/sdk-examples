import BaseItem from '../BaseItem';

export default class ShackleItem extends BaseItem {
  static readonly id = 'shackle';
  static readonly name = 'Shackle';
  static readonly iconImageUri = 'icons/items/shackle.png';
  static readonly description = `A heavy metal shackle. Seems good for scrap metal.`;
  static readonly stackable = true;
  static readonly sellPrice = 14;
}