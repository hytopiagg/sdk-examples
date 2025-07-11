import BaseItem from '../BaseItem';

export default class WeaverCarapaceItem extends BaseItem {
  static readonly id = 'weaver_carapace';
  static readonly name = 'Weaver Carapace';
  static readonly iconImageUri = 'icons/items/weaver-carapace.png';
  static readonly description = 'A tough carapace from a Weaver. Hard like a rock.';
  static readonly stackable = true;
  static readonly buyPrice = 70;
  static readonly sellPrice = 7;
}