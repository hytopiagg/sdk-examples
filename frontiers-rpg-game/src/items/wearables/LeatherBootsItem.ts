import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class LeatherBootsItem extends BaseWearableItem {
  static readonly id = 'leather_boots';
  static readonly name = 'Leather Boots';
  static readonly iconImageUri = 'icons/items/leather-boots.png';
  static readonly description = `A sturdy pair of boots made from thick leather.`;
  static readonly buyPrice = 350;
  static readonly sellPrice = 35;

  static readonly damageReduction = 2;

  static readonly slot: WearableSlot = 'boots';
}