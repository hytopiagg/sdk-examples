import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class AdventurerHoodItem extends BaseWearableItem {
  static readonly id = 'adventurer_hood';
  static readonly name = 'Adventurer Hood';
  static readonly iconImageUri = 'icons/items/adventurer-hood.png';
  static readonly description = `A basic head covering, very stylish!`;
  static readonly buyPrice = 150;
  static readonly sellPrice = 15;

  static readonly damageReduction = 1;

  static readonly slot: WearableSlot = 'helmet';
}