import BaseItem from '../BaseItem';

export default class GorkinFootItem extends BaseItem {
  static readonly id = 'gorkin_foot';
  static readonly name = 'Gorkin Foot';
  static readonly iconImageUri = 'icons/items/gorkin-foot.png';
  static readonly description = `A gorkin's foot. Some use them as good luck charms!`;
  static readonly stackable = true;
  static readonly sellPrice = 19;
}