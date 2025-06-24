import BaseItem from '../BaseItem';

export default class RatkinBonesItem extends BaseItem {
  static readonly id = 'ratkin_bones';
  static readonly name = 'Ratkin Bones';
  static readonly iconImageUri = 'icons/items/ratkin-bones.png';
  static readonly description = 'A pile of bones from a Ratkin. Strangely fragile.';
  static readonly stackable = true;
  static readonly sellPrice = 3;
}