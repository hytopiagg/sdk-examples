import BaseItem from '../BaseItem';

export default class WeaverHeartItem extends BaseItem {
  static readonly id = 'weaver_heart';
  static readonly name = 'Weaver Heart';
  static readonly iconImageUri = 'icons/items/weaver-heart.png';
  static readonly description = `Slimy Weaver's heart with 6 chambers. It's still beating.`;
  static readonly stackable = true;
  static readonly sellPrice = 15;
}