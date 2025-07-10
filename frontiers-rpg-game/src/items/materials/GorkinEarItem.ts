import BaseItem from '../BaseItem';

export default class GorkinEarItem extends BaseItem {
  static readonly id = 'gorkin_ear';
  static readonly name = 'Gorkin Ear';
  static readonly iconImageUri = 'icons/items/gorkin-ear.png';
  static readonly description = `A gorkin's ear. It's still twitching.`;
  static readonly stackable = true;
  static readonly sellPrice = 13;
}