import BaseItem from '../BaseItem';

export default class WeaverEggItem extends BaseItem {
  static readonly id = 'weaver_egg';
  static readonly name = 'Weaver Egg';
  static readonly iconImageUri = 'icons/items/weaver-egg.png';
  static readonly description = `An unhatched Weaver egg. Hopefully it doesn't hatch while carrying it...`;
  static readonly stackable = true;
  static readonly sellPrice = 12;
}