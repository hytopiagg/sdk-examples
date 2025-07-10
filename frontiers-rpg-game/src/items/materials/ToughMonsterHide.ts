import BaseItem from '../BaseItem';

export default class ToughMonsterHide extends BaseItem {
  static readonly id = 'tough_monster_hide';
  static readonly name = 'Tough Monster Hide';
  static readonly iconImageUri = 'icons/items/tough-monster-hide.png';
  static readonly description = 'Thick hide from a Frontier monster. Smells awful.';
  static readonly stackable = true;
  static readonly sellPrice = 25;
}