import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class LeatherHelmetItem extends BaseWearableItem {
  static readonly id = 'leather_helmet';
  static readonly name = 'Leather Helmet';
  static readonly iconImageUri = 'icons/items/leather-helmet.png';
  static readonly description = `A protective helmet made from thick leather.`;
  static readonly buyPrice = 350;
  static readonly sellPrice = 35;

  static readonly damageReduction = 2;

  static readonly slot: WearableSlot = 'helmet';
}