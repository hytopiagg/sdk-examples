import BaseItem from '../BaseItem';

export default class RatkinToothItem extends BaseItem {
  static readonly id = 'ratkin_tooth';
  static readonly name = 'Ratkin Tooth';
  static readonly iconImageUri = 'icons/items/ratkin-tooth.png';
  static readonly description = 'A sharp tooth from a Ratkin. Still has some bite to it.';
  static readonly stackable = true;
  static readonly sellPrice = 3;
}