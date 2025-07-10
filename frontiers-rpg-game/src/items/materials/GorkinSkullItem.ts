import BaseItem from '../BaseItem';

export default class GorkinSkullItem extends BaseItem {
  static readonly id = 'gorkin_skull';
  static readonly name = 'Gorkin Skull';
  static readonly iconImageUri = 'icons/items/gorkin-skull.png';
  static readonly description = `A gorkin's skull. Surprisingly dense, must be why they're so tough.`;
  static readonly stackable = true;
  static readonly sellPrice = 20;
}