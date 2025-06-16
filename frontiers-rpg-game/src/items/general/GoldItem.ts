import BaseItem from '../BaseItem';

export default class GoldItem extends BaseItem {
  static readonly id = 'gold';
  static readonly name = 'Gold';
  static readonly iconImageUri = 'icons/items/gold.png';
  static readonly description = `Bright coins minted in Stalkhaven's frontier foundry. Sought by all who travel The Frontier and beyond.`;
  static readonly sellPrice = 0;
  static readonly stackable = true;
}