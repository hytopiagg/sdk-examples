import BaseItem from '../BaseItem';

export default class ShatteredSwordItem extends BaseItem {
  static readonly id = 'shattered_sword';
  static readonly name = 'Shattered Sword';
  static readonly iconImageUri = 'icons/items/shattered-sword.png';
  static readonly description = `The remaining pieces of a sword. The shards are still sharp.`;
  static readonly stackable = true;
  static readonly sellPrice = 16;
}