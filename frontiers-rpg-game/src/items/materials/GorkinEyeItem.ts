import BaseItem from '../BaseItem';

export default class GorkinEyeItem extends BaseItem {
  static readonly id = 'gorkin_eye';
  static readonly name = 'Gorkin Eye';
  static readonly iconImageUri = 'icons/items/gorkin-eye.png';
  static readonly description = `A gorkin's eye. Unusually small.`;
  static readonly stackable = true;
  static readonly sellPrice = 16;
}