import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class AdventurerTunicItem extends BaseWearableItem {
  static readonly id = 'adventurer_tunic';
  static readonly name = 'Adventurer Tunic';
  static readonly iconImageUri = 'icons/items/adventurer-tunic.png';
  static readonly description = `A basic tunic, nothing special about it.`;
  static readonly buyPrice = 350;
  static readonly sellPrice = 35;

  static readonly damageReduction = 3;

  static readonly slot: WearableSlot = 'armor';
}