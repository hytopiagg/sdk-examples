import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class LeatherBracersItem extends BaseWearableItem {
  static readonly id = 'leather_bracers';
  static readonly name = 'Leather Bracers';
  static readonly iconImageUri = 'icons/items/leather-bracers.png';
  static readonly description = `A pair of supportive bracers made from thick leather.`;
  static readonly buyPrice = 300;
  static readonly sellPrice = 30;

  static readonly damageReduction = 2;

  static readonly slot: WearableSlot = 'gloves';
}