import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class IronGrievesItem extends BaseWearableItem {
  static readonly id = 'iron_grieves';
  static readonly name = 'Iron Grieves';
  static readonly iconImageUri = 'icons/items/iron-grieves.png';
  static readonly description = `A heavy pair of grieves made from iron.`;
  static readonly buyPrice = 600;
  static readonly sellPrice = 60;

  static readonly damageReduction = 3;

  static readonly slot: WearableSlot = 'boots';
}