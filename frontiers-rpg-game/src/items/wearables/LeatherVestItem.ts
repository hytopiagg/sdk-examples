import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class LeatherVestItem extends BaseWearableItem {
  static readonly id = 'leather_vest';
  static readonly name = 'Leather Vest';
  static readonly iconImageUri = 'icons/items/leather-vest.png';
  static readonly description = `A tough multi-layer vest made from thick leather.`;
  static readonly buyPrice = 700;
  static readonly sellPrice = 70;

  static readonly damageReduction = 4;

  static readonly slot: WearableSlot = 'armor';
}