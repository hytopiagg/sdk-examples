import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class AdventurerLeggingsItem extends BaseWearableItem {
  static readonly id = 'adventurer_leggings';
  static readonly name = 'Adventurer Leggings';
  static readonly iconImageUri = 'icons/items/adventurer-leggings.png';
  static readonly description = `A basic pair of leggings, they'll keep you warm.`;
  static readonly buyPrice = 250;
  static readonly sellPrice = 25;

  static readonly damageReduction = 2;

  static readonly slot: WearableSlot = 'leggings';
}