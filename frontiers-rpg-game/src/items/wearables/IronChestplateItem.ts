import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class IronChestplateItem extends BaseWearableItem {
  static readonly id = 'iron_chestplate';
  static readonly name = 'Iron Chestplate';
  static readonly iconImageUri = 'icons/items/iron-chestplate.png';
  static readonly description = `A sturdy chestplate made from iron.`;
  static readonly buyPrice = 1000;
  static readonly sellPrice = 100;

  static readonly damageReduction = 5;
  static readonly damageReductionPercent = 0.03; // 3% reduction

  static readonly slot: WearableSlot = 'armor';
}