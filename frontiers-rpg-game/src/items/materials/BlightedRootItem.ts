import BaseItem from '../BaseItem';

export default class BlightedRootItem extends BaseItem {
  static readonly id = 'blighted_root';
  static readonly name = 'Blighted Root';
  static readonly iconImageUri = 'icons/items/blighted-root.png';
  static readonly description = 'A twisted root from a Blight Bloom. It pulses as if its still alive...';
  static readonly stackable = true;
  static readonly sellPrice = 25;
}