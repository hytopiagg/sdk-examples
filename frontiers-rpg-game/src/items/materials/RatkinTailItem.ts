import BaseItem from '../BaseItem';

export default class RatkinTailItem extends BaseItem {
  static readonly id = 'ratkin_tail';
  static readonly name = 'Ratkin Tail';
  static readonly iconImageUri = 'icons/items/ratkin-tail.png';
  static readonly description = 'A tail from a ratkin.';
  static readonly stackable = true;
  static readonly buyPrice = 40;
  static readonly sellPrice = 15;
}