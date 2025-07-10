import BaseItem from '../BaseItem';

export default class WeaverSilkItem extends BaseItem {
  static readonly id = 'weaver_silk';
  static readonly name = 'Weaver Silk';
  static readonly iconImageUri = 'icons/items/weaver-silk.png';
  static readonly description = `Fine, strong Weaver silk. It glistens in the sunlight.`;
  static readonly stackable = true;
  static readonly sellPrice = 18;
}