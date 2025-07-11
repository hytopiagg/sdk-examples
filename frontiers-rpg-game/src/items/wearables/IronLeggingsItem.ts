import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class IronLeggingsItem extends BaseWearableItem {
  static readonly id = 'iron_leggings';
  static readonly name = 'Iron Leggings';
  static readonly iconImageUri = 'icons/items/iron-leggings.png';
  static readonly description = `A sturdy pair of leggings made from iron.`;
  static readonly buyPrice = 750;
  static readonly sellPrice = 75;

  static readonly damageReduction = 4;
  static readonly damageReductionPercent = 0.02; // 2% reduction

  static readonly slot: WearableSlot = 'leggings';
}