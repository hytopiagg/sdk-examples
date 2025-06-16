import BaseItem from '../BaseItem';

export default class RatkinEyesItem extends BaseItem {
  static readonly id = 'ratkin_eyes';
  static readonly name = 'Ratkin Eyes';
  static readonly iconImageUri = 'icons/items/ratkin-eyes.png';
  static readonly description = 'Glassy eyes from a Ratkin. They seem to still be watching you.';
  static readonly stackable = true;
  static readonly sellPrice = 8;
}