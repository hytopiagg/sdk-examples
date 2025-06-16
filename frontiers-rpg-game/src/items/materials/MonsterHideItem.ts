import BaseItem from '../BaseItem';

export default class MonsterHideItem extends BaseItem {
  static readonly id = 'monster_hide';
  static readonly name = 'Monster Hide';
  static readonly iconImageUri = 'icons/items/monster-hide.png';
  static readonly description = 'Thick hide from a Frontier beast. Tough and weathered.';
  static readonly stackable = true;
  static readonly sellPrice = 15;
}