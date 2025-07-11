import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class IronGauntletsItem extends BaseWearableItem {
  static readonly id = 'iron_gauntlets';
  static readonly name = 'Iron Gauntlets';
  static readonly iconImageUri = 'icons/items/iron-gauntlets.png';
  static readonly description = `A pair of protective gauntlets made from iron.`;
  static readonly buyPrice = 500;
  static readonly sellPrice = 50;

  static readonly damageReduction = 3;

  static readonly slot: WearableSlot = 'gloves';
}