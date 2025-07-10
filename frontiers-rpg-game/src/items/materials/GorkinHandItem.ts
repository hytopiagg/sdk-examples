import BaseItem from '../BaseItem';

export default class GorkinHandItem extends BaseItem {
  static readonly id = 'gorkin_hand';
  static readonly name = 'Gorkin Hand';
  static readonly iconImageUri = 'icons/items/gorkin-hand.png';
  static readonly description = `A gorkin's hand. Green and cold.`;
  static readonly stackable = true;
  static readonly sellPrice = 16;
}