import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class LeatherLeggingsItem extends BaseWearableItem {
  static readonly id = 'leather_leggings';
  static readonly name = 'Leather Leggings';
  static readonly iconImageUri = 'icons/items/leather-leggings.png';
  static readonly description = `A comfortable pair of leggings made from thick leather.`;
  static readonly buyPrice = 500;
  static readonly sellPrice = 50;

  static readonly damageReduction = 3;

  static readonly slot: WearableSlot = 'leggings';
}