import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class IronHelmetItem extends BaseWearableItem {
  static readonly id = 'iron_helmet';
  static readonly name = 'Iron Helmet';
  static readonly iconImageUri = 'icons/items/iron-helmet.png';
  static readonly description = `A protective helmet made from iron.`;
  static readonly buyPrice = 500;
  static readonly sellPrice = 500;

  static readonly damageReduction = 3;
  static readonly damageReductionPercent = 0.01; // 1% reduction

  static readonly slot: WearableSlot = 'helmet';
}